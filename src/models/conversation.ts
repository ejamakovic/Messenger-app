export type Conversation = {
  id: number;
  type: "PUBLIC" | "PRIVATE" | "GROUP";

  name?: string;
  imageUrl?: string;
};