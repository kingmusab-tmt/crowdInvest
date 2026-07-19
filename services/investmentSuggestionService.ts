import InvestmentSuggestion from "@/models/InvestmentSuggestion";
import User from "@/models/User";
import { createNotification } from "./notificationService";

export const VOTING_WINDOW_DAYS = 3;

export function getVotingDeadline(from: Date = new Date()): Date {
  return new Date(from.getTime() + VOTING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export async function notifyAdminsOfNewSuggestion(
  suggestion: any,
  suggesterName: string
) {
  try {
    const admins = await User.find({ role: "Admin" }).select("_id");
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin._id,
          type: "investment_suggestion",
          title: "New Investment Suggestion",
          message: `${suggesterName} suggested a new investment: "${suggestion.title}". Review it to approve or reject.`,
          relatedData: { suggestionId: suggestion._id },
          actionUrl: "/admin/investments",
        }).catch((err) =>
          console.error("Failed to notify admin of new suggestion:", err)
        )
      )
    );
  } catch (error) {
    console.error("Failed to notify admins of new suggestion:", error);
  }
}

export async function notifySuggesterOfDecision(
  suggestion: any,
  approved: boolean,
  rejectionReason?: string
) {
  try {
    await createNotification({
      userId: suggestion.suggestedBy,
      type: approved
        ? "investment_suggestion_approved"
        : "investment_suggestion_rejected",
      title: approved
        ? "Investment Suggestion Approved"
        : "Investment Suggestion Rejected",
      message: approved
        ? `Your investment suggestion "${suggestion.title}" was approved and is now open for community voting.`
        : `Your investment suggestion "${suggestion.title}" was rejected.${
            rejectionReason ? ` Reason: ${rejectionReason}` : ""
          }`,
      relatedData: { suggestionId: suggestion._id },
      actionUrl: "/dashboard/investments",
    });
  } catch (error) {
    console.error("Failed to notify suggester of decision:", error);
  }
}

export async function notifyMembersVotingOpen(suggestion: any) {
  try {
    const members = await User.find({
      community: suggestion.community,
      _id: { $ne: suggestion.suggestedBy },
    }).select("_id");

    await Promise.all(
      members.map((member) =>
        createNotification({
          userId: member._id,
          type: "investment_voting_open",
          title: "Investment Voting Open",
          message: `A new investment suggestion "${suggestion.title}" is open for voting. Cast your vote within ${VOTING_WINDOW_DAYS} days.`,
          relatedData: { suggestionId: suggestion._id },
          actionUrl: "/dashboard/investments",
        }).catch((err) =>
          console.error("Failed to notify member of voting open:", err)
        )
      )
    );
  } catch (error) {
    console.error("Failed to notify members of voting open:", error);
  }
}

interface ClosedVotingResult {
  suggestion: any;
  yesVotes: number;
  noVotes: number;
  passed: boolean;
}

/**
 * Tallies votes on a single suggestion and writes the final outcome
 * (strict majority Yes required to pass; ties and No-majorities fail).
 * Does not notify — callers should fire `notifyVotingClosedResults`
 * (ideally via `after()`) separately so slow email sends don't block
 * the response.
 */
export async function resolveVotingOutcome(
  suggestion: any
): Promise<ClosedVotingResult> {
  const votes = suggestion.votes || [];
  const yesVotes = votes.filter((v: any) => v.vote === "yes").length;
  const noVotes = votes.filter((v: any) => v.vote === "no").length;
  const passed = yesVotes > noVotes;

  suggestion.status = passed ? "Approved for Investing" : "Rejected";
  if (!passed) {
    suggestion.rejectionReason =
      yesVotes === 0 && noVotes === 0
        ? "Voting closed: no votes were cast before the deadline."
        : yesVotes === noVotes
        ? `Voting closed: the vote was tied (${yesVotes} Yes, ${noVotes} No).`
        : `Voting closed: majority voted No (${yesVotes} Yes, ${noVotes} No).`;
  }
  await suggestion.save();

  return { suggestion, yesVotes, noVotes, passed };
}

/**
 * Finds any suggestion still in "Voting" status whose votingDeadline has
 * passed, and resolves it based on majority vote. Called lazily from GET
 * routes since this app has no cron infrastructure. Only performs the DB
 * writes — callers should fire `notifyVotingClosedResults` (ideally via
 * `after()`) separately so slow email sends don't block the response.
 */
export async function closeExpiredVoting(): Promise<ClosedVotingResult[]> {
  const now = new Date();
  const expired = await InvestmentSuggestion.find({
    status: "Voting",
    votingDeadline: { $lte: now },
  });

  const closed: ClosedVotingResult[] = [];
  for (const suggestion of expired) {
    closed.push(await resolveVotingOutcome(suggestion));
  }

  return closed;
}

export async function notifyVotingClosedResults(
  closed: ClosedVotingResult[]
) {
  await Promise.all(
    closed.map(({ suggestion, yesVotes, noVotes, passed }) =>
      createNotification({
        userId: suggestion.suggestedBy,
        type: "investment_voting_closed",
        title: "Investment Voting Closed",
        message: passed
          ? `Voting has closed for "${suggestion.title}" — the community approved it for investing (${yesVotes} Yes, ${noVotes} No).`
          : `Voting has closed for "${suggestion.title}" — the community did not approve it (${yesVotes} Yes, ${noVotes} No).`,
        relatedData: { suggestionId: suggestion._id, yesVotes, noVotes },
        actionUrl: "/dashboard/investments",
      }).catch((err) =>
        console.error("Failed to notify suggester of voting result:", err)
      )
    )
  );
}
