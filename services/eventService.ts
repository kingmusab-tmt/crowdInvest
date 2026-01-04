// Event Service
export type EventStatus = "Upcoming" | "Planning" | "Completed";
export type Event = {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  status: EventStatus;
  imageUrl?: string;
  imageHint?: string;
};
export async function getEvents(): Promise<Event[]> {
  const res = await fetch("/api/events");
  return res.ok
    ? (await res.json()).map((e: any) => ({ ...e, id: e._id }))
    : [];
}
