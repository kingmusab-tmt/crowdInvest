import Proposal from "@/models/Proposal";
import User from "@/models/User";
import { createNotification } from "./notificationService";

export const PROPOSAL_VOTING_WINDOW_DAYS = 3;

export function getProposalVotingDeadline(from: Date = new Date()): Date {
  return new Date(
    from.getTime() + PROPOSAL_VOTING_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );
}

export async function notifyAdminsOfNewProposal(
  proposal: any,
  proposerName: string
) {
  try {
    const admins = await User.find({ role: "Admin" }).select("_id");
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin._id,
          type: "proposal",
          title: "New Community Proposal",
          message: `${proposerName} submitted a new proposal: "${proposal.title}". Review it to approve or reject.`,
          relatedData: { proposalId: proposal._id },
          actionUrl: "/admin/proposals",
        }).catch((err) =>
          console.error("Failed to notify admin of new proposal:", err)
        )
      )
    );
  } catch (error) {
    console.error("Failed to notify admins of new proposal:", error);
  }
}

export async function notifyProposerOfDecision(
  proposal: any,
  approvedToVoting: boolean,
  rejectionReason?: string
) {
  try {
    await createNotification({
      userId: proposal.proposedBy,
      type: "proposal",
      title: approvedToVoting ? "Proposal Approved" : "Proposal Rejected",
      message: approvedToVoting
        ? `Your proposal "${proposal.title}" was approved and is now open for community voting.`
        : `Your proposal "${proposal.title}" was rejected.${
            rejectionReason ? ` Reason: ${rejectionReason}` : ""
          }`,
      relatedData: { proposalId: proposal._id },
      actionUrl: "/dashboard/proposals",
    });
  } catch (error) {
    console.error("Failed to notify proposer of decision:", error);
  }
}

export async function notifyMembersProposalVotingOpen(proposal: any) {
  try {
    const members = await User.find({
      community: proposal.community,
      _id: { $ne: proposal.proposedBy },
    }).select("_id");

    await Promise.all(
      members.map((member) =>
        createNotification({
          userId: member._id,
          type: "proposal",
          title: "Proposal Voting Open",
          message: `A new proposal "${proposal.title}" is open for voting. Cast your vote within ${PROPOSAL_VOTING_WINDOW_DAYS} days.`,
          relatedData: { proposalId: proposal._id },
          actionUrl: "/dashboard/proposals",
        }).catch((err) =>
          console.error("Failed to notify member of proposal voting open:", err)
        )
      )
    );
  } catch (error) {
    console.error("Failed to notify members of proposal voting open:", error);
  }
}

interface ClosedProposalVotingResult {
  proposal: any;
  yesVotes: number;
  noVotes: number;
  passed: boolean;
}

/**
 * Tallies votes on a single proposal and writes the final outcome (strict
 * majority Yes required to pass; ties and No-majorities fail).
 */
export async function resolveProposalVotingOutcome(
  proposal: any
): Promise<ClosedProposalVotingResult> {
  const votes = proposal.votes || [];
  const yesVotes = votes.filter((v: any) => v.vote === "yes").length;
  const noVotes = votes.filter((v: any) => v.vote === "no").length;
  const passed = yesVotes > noVotes;

  proposal.status = passed ? "approved" : "rejected";
  if (!passed) {
    proposal.rejectionReason =
      yesVotes === 0 && noVotes === 0
        ? "Voting closed: no votes were cast before the deadline."
        : yesVotes === noVotes
        ? `Voting closed: the vote was tied (${yesVotes} Yes, ${noVotes} No).`
        : `Voting closed: majority voted No (${yesVotes} Yes, ${noVotes} No).`;
  }
  await proposal.save();

  return { proposal, yesVotes, noVotes, passed };
}

/**
 * Finds any proposal still in "voting" status whose votingDeadline has
 * passed, and resolves it based on majority vote. Called lazily from GET
 * routes since this app has no cron infrastructure.
 */
export async function closeExpiredProposalVoting(): Promise<
  ClosedProposalVotingResult[]
> {
  const now = new Date();
  const expired = await Proposal.find({
    status: "voting",
    votingDeadline: { $lte: now },
  });

  const closed: ClosedProposalVotingResult[] = [];
  for (const proposal of expired) {
    closed.push(await resolveProposalVotingOutcome(proposal));
  }

  return closed;
}

/**
 * Notifies every member of the proposal's community (including the
 * proposer) of the final voting outcome, once voting has closed.
 */
export async function notifyAllMembersOfProposalResult(
  closed: ClosedProposalVotingResult[]
) {
  for (const { proposal, yesVotes, noVotes, passed } of closed) {
    try {
      const members = await User.find({ community: proposal.community }).select(
        "_id"
      );
      await Promise.all(
        members.map((member) =>
          createNotification({
            userId: member._id,
            type: "proposal",
            title: "Proposal Voting Closed",
            message: passed
              ? `Voting has closed for "${proposal.title}" — the community approved it (${yesVotes} Yes, ${noVotes} No).`
              : `Voting has closed for "${proposal.title}" — the community did not approve it (${yesVotes} Yes, ${noVotes} No).`,
            relatedData: { proposalId: proposal._id, yesVotes, noVotes },
            actionUrl: "/dashboard/proposals",
          }).catch((err) =>
            console.error("Failed to notify member of proposal result:", err)
          )
        )
      );
    } catch (error) {
      console.error("Failed to notify members of proposal result:", error);
    }
  }
}
