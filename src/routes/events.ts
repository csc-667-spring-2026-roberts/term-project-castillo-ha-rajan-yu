import { Router, type Request, type Response } from "express"; //to define route cleanly
import { requireAuth } from "../middleware/auth.js"; //protexts SSE endpoint with auth
import { addSubscriber, removeSubscriber } from "../utils/sse.js"; //connect to SSE file

//SSE ROUTEEE
//file lets broswer actually subscirbe while sse.ts manages subscribers

const eventsRouter = Router();
//create router instance

//handle GET route request
eventsRouter.get("/api/events", requireAuth, (request: Request, response: Response) => {
  const channel = typeof request.query.channel === "string" ? request.query.channel : "lobby";
  //reads query string to give what channel or room support

  response.setHeader("Content-Type", "text/event-stream"); //tells browser its an SSE stream
  response.setHeader("Cache-Control", "no-cache"); //prevents caching issues
  response.setHeader("Connection", "keep-alive"); //keeps connection open

  //flush headers right away so browser treats it as an open sse stream
  response.flushHeaders();

  //small hello test to confirm connection is active (DB)
  response.write(`event: connected\n`);
  response.write(`data: ${JSON.stringify({ channel })}\n\n`);

  addSubscriber(channel, response);
  //current browser connection is saved into cahnnel map

  //remove subscriber from map and ends repsonse cleanly when connection drops or tab cloesed
  request.on("close", () => {
    removeSubscriber(channel, response);
    response.end();
  });
  //just clean up
});

export default eventsRouter;
