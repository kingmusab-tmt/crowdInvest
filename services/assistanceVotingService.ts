import Assistance from "@/models/Assistance";
import User from "@/models/User";
import { createNotification } from "./notificationService";

export const ASSISTANCE_VOTING_WINDOW_DAYS = 3;

export function getAssistanceVotingDeadline(from: Date = new Date()): Date {
  return new Date(
    from.getTime() + ASSISTANCE_VOTING_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );
}

export async function notifyAdminsOfNewAssistanceRequest(
  request: any,
  requesterName: string
) {
  try {
    const admins = await User.find({ role: "Admin" }).select("_id");
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin._id,
          type: "assistance",
          title: "New Assistance Request",
          message: `${requesterName} requested assistance: "${request.title}". Review it to approve or reject.`,
          relatedData: { assistanceId: request._id },
          actionUrl: "/admin/assistance",
        }).catch((err) =>
          console.error("Failed to notify admin of new assistance request:", err)
        )
      )
    );
  } catch (error) {
    console.error("Failed to notify admins of new assistance request:", error);
  }
}

export async function notifyRequesterOfDecision(
  request: any,
  approvedToVoting: boolean,
  rejectionReason?: string
) {
  try {
    await createNotification({
      userId: request.requestedBy,
      type: "assistance",
      title: approvedToVoting
        ? "Assistance Request Approved"
        : "Assistance Request Rejected",
      message: approvedToVoting
        ? `Your assistance request "${request.title}" was approved and is now open for community voting.`
        : `Your assistance request "${request.title}" was rejected.${
            rejectionReason ? ` Reason: ${rejectionReason}` : ""
          }`,
      relatedData: { assistanceId: request._id },
      actionUrl: "/dashboard/assistance",
    });
  } catch (error) {
    console.error("Failed to notify requester of decision:", error);
  }
}

export async function notifyMembersAssistanceVotingOpen(request: any) {
  try {
    const members = await User.find({
      community: request.community,
      _id: { $ne: request.requestedBy },
    }).select("_id");

    await Promise.all(
      members.map((member) =>
        createNotification({
          userId: member._id,
          type: "assistance",
          title: "Assistance Request Voting Open",
          message: `A new assistance request "${request.title}" is open for voting. Cast your vote within ${ASSISTANCE_VOTING_WINDOW_DAYS} days.`,
          relatedData: { assistanceId: request._id },
          actionUrl: "/dashboard/assistance",
        }).catch((err) =>
          console.error(
            "Failed to notify member of assistance voting open:",
            err
          )
        )
      )
    );
  } catch (error) {
    console.error(
      "Failed to notify members of assistance voting open:",
      error
    );
  }
}

interface ClosedAssistanceVotingResult {
  request: any;
  assistVotes: number;
  notAssistVotes: number;
  passed: boolean;
}

/**
 * Tallies votes on a single assistance request and writes the final
 * outcome (strict majority Assist required to pass; ties and
 * Not-Assist-majorities fail).
 */
export async function resolveAssistanceVotingOutcome(
  request: any
): Promise<ClosedAssistanceVotingResult> {
  const votes = request.votes || [];
  const assistVotes = votes.filter((v: any) => v.vote === "assist").length;
  const notAssistVotes = votes.filter(
    (v: any) => v.vote === "not-assist"
  ).length;
  const passed = assistVotes > notAssistVotes;

  request.status = passed ? "Approved" : "Rejected";
  if (!passed) {
    request.rejectionReason =
      assistVotes === 0 && notAssistVotes === 0
        ? "Voting closed: no votes were cast before the deadline."
        : assistVotes === notAssistVotes
        ? `Voting closed: the vote was tied (${assistVotes} Assist, ${notAssistVotes} Not Assist).`
        : `Voting closed: majority voted Not Assist (${assistVotes} Assist, ${notAssistVotes} Not Assist).`;
  }
  await request.save();

  return { request, assistVotes, notAssistVotes, passed };
}

/**
 * Finds any assistance request still in "Voting" status whose
 * votingDeadline has passed, and resolves it based on majority vote.
 * Called lazily from GET routes since this app has no cron infrastructure.
 */
export async function closeExpiredAssistanceVoting(): Promise<
  ClosedAssistanceVotingResult[]
> {
  const now = new Date();
  const expired = await Assistance.find({
    status: "Voting",
    votingDeadline: { $lte: now },
  });

  const closed: ClosedAssistanceVotingResult[] = [];
  for (const request of expired) {
    closed.push(await resolveAssistanceVotingOutcome(request));
  }

  return closed;
}

/**
 * Notifies every member of the request's community (including the
 * requester) of the final voting outcome, once voting has closed.
 */
export async function notifyAllMembersOfAssistanceResult(
  closed: ClosedAssistanceVotingResult[]
) {
  for (const { request, assistVotes, notAssistVotes, passed } of closed) {
    try {
      const members = await User.find({
        community: request.community,
      }).select("_id");
      await Promise.all(
        members.map((member) =>
          createNotification({
            userId: member._id,
            type: "assistance",
            title: "Assistance Request Voting Closed",
            message: passed
              ? `Voting has closed for "${request.title}" — the community approved it (${assistVotes} Assist, ${notAssistVotes} Not Assist).`
              : `Voting has closed for "${request.title}" — the community did not approve it (${assistVotes} Assist, ${notAssistVotes} Not Assist).`,
            relatedData: {
              assistanceId: request._id,
              assistVotes,
              notAssistVotes,
            },
            actionUrl: "/dashboard/assistance",
          }).catch((err) =>
            console.error(
              "Failed to notify member of assistance result:",
              err
            )
          )
        )
      );
    } catch (error) {
      console.error("Failed to notify members of assistance result:", error);
    }
  }
}
