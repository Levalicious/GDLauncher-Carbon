import { QueryClient } from "@tanstack/solid-query";
import { WebsocketTransport, createClient } from "@rspc/client";
import { createSolidQueryHooks } from "@rspc/solid";
import type { Procedures } from "@gd/core_module";
import { createNotification } from "@gd/ui";

export const rspc = createSolidQueryHooks<Procedures>();
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // default: true
      networkMode: "always"
    },
    mutations: {
      networkMode: "always"
    }
  }
});

export let port: number | null = null;

export default function initRspc(_port: number) {
  const addNotification = createNotification();

  port = _port;

  const transport = new WebsocketTransport(`ws://127.0.0.1:${_port}/rspc/ws`);

  const client = createClient<Procedures>({
    transport,
    onError: (error) => {
      console.error("RSPC error:", error);

      try {
        let parsed = JSON.parse(error.message);
        addNotification({
          name: "RSPC Error",
          content: parsed.cause.reduce((acc: string, e: any) => {
            return acc + (!acc ? "" : " | ") + e.display;
          }, ""),
          type: "error"
        });
      } catch {
        addNotification({
          name: error.message,
          type: "error"
        });
      }
    }
  });

  const createInvalidateQuery = () => {
    const context = rspc.useContext();
    let socket: WebSocket;

    type InvalidateOperation = {
      key: string;
      args: any;
    };

    function connect() {
      // Create a new WebSocket connection
      socket = new WebSocket(`ws://127.0.0.1:${_port}/invalidations`);

      socket.addEventListener("open", () => {
        console.log("Invalidations channel connected");
      });

      socket.addEventListener("message", (event) => {
        const data: InvalidateOperation = JSON.parse(event.data);
        const key = [data.key];
        if (data.args !== null) {
          key.push(data.args);
        }
        // console.log("Invalidations channel", key, data.args);
        context.queryClient.invalidateQueries({
          queryKey: key
        });
      });

      socket.addEventListener("close", () => {
        console.log(
          "Invalidations channel disconnected. Attempting to reconnect..."
        );
        setTimeout(connect, 1000);
      });

      socket.addEventListener("error", (error) => {
        console.error("Invalidations channel error:", error);
        socket.close();
      });
    }

    connect();
  };

  return {
    client,
    createInvalidateQuery
  };
}
