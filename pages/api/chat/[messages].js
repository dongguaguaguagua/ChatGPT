export default async function handler(req, res) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Content-Encoding", "none");

  try {
    // const value posting to openai.
    const { messages } = req.query;
    console.log(messages);
    console.log(JSON.parse(messages));
    const model = "gpt-3.5-turbo";
    const apikey = process.env.OPENAI_API_KEY;
    const top_p = 0.9;
    const presence_penalty = 0;
    const frequency_penalty = 0;
    const max_tokens = 2000;
    const temperature = 0.4;

    let bugSolver = "";
    // parse received data
    console.log("fetching resp...")
    let response = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apikey}`
        },
        body: JSON.stringify({
          model: model,
          messages: JSON.parse(messages),
          temperature: temperature,
          top_p: top_p,
          frequency_penalty: frequency_penalty,
          presence_penalty: presence_penalty,
          max_tokens: max_tokens,
          stream: true,
          n: 1,
        }),
      }
    );
    console.log("got resp.")
    function dataParser(data) {
      bugSolver = "";
      data = data.trim();
      if (data === "" || data === "[DONE]") {
        return "[PASS]";
      }
      try {
        return JSON.parse(data);
      } catch (error) {
        console.log("[ERROR]", data);
        bugSolver = data;
        return "[BROKEN]";
      }
    }
    console.log("start streaming...");
    for await (let value of response.body) {
      value = bugSolver + decoder.decode(value);
      console.log("value:", value);
      value.split("data: ").forEach(item => {
        const event = dataParser(item);
        if (event !== "[PASS]" && event !== "[BROKEN]") {
          if ('error' in event) { // 报错
            res.write(encoder.encode(JSON.stringify(event, undefined, 2)));
            res.end();
          } else if (event.choices[0].finish_reason === "stop") {
            res.end();
          } else {
            res.write(encoder.encode(event.choices[0].delta?.content));
          }
        }
      })
    }
  } catch (error) {
    res.write(encoder.encode("TypeError: NetworkError when attempting to fetch resource."));
    console.error('Network Error:', error);
    res.end();
  }
}
