export type Conversation = {
  id: number;
  type: "GLOBAL" | "PRIVATE" | "GROUP";
  name?: string;
  imageUrl?: string;
};