import type { Response } from "express";
//import express response type since each SSE conenction is just an express response object that stays open

//just for readability
type SseClient = Response;
type ChannelName = string;

//create in memory map like a set of connected browser responses
//its how server rmemeber which clients are lisetning for which updates
const channels = new Map<ChannelName, Set<SseClient>>();

//check if lobby already exists in map if not create new empty set
export function addSubscriber(channel: string, response: Response): void {
  if (!channels.has(channel)) {
    channels.set(channel, new Set());
  }

  channels.get(channel)?.add(response);
  //adds current browsers reponse obj into set
}
//use set to avoid duplicates and nice for storing unique connected clients

//when browser closes tab or disconnect then finds set for channel
//and removes that reponse obj
export function removeSubscriber(channel: string, response: Response): void {
  const subscribers = channels.get(channel);
  if (!subscribers) return;

  subscribers.delete(response);

  if (subscribers.size === 0) {
    channels.delete(channel);
  }
  //removes channel entirely if nobody left in the channel
}

//find all subscribers lisetning to given channel

export function broadcast(channel: string, eventName: string, payload: unknown): void {
  const subscribers = channels.get(channel);
  if (!subscribers) return;

  const data = JSON.stringify(payload);
  //convert payload into json text since sse sends text
  //so obj like games: updatedGames must be converted to string before sneding

  //loop through every connected client and write an SSE event into each open response
  for (const response of subscribers) {
    response.write(`event: ${eventName}\n`);
    response.write(`data: ${data}\n\n`);
  }
}
