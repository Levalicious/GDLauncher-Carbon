import { contextBridge, ipcRenderer } from "electron";
import { domReady } from "./utils";

export type Log = {
  type: "info" | "error";
  message: string;
};

function pathJoin(...paths: string[]) {
  let pathSep = "/";
  if (process.platform === "win32") {
    pathSep = "\\";
  }

  return paths.join(pathSep);
}

let oDiv: HTMLDivElement;
function useLoading() {
  return {
    async fatalError(error: string | Log[], moduleName: string) {
      const userData = await ipcRenderer.invoke("getUserData");
      const initialRuntimePath = await ipcRenderer.invoke(
        "getInitialRuntimePath"
      );
      const runtimePath = await ipcRenderer.invoke("getRuntimePath");
      const isString = typeof error === "string";

      if (Array.isArray(error)) {
        console.log("Error from preload", error);
        error = error.map((log) => log.message).join("<br /><br />");
      } else {
        error = error.toString();
      }

      oDiv.classList.add("appFatalCrash");

      let fontSize = isString ? "1.3rem" : "1rem";

      const errorText = `
      <div style="font-size: ${fontSize}; font-weight: 300; background: var(--darkSlate-900); height: 40%; overflow-y: auto; padding: 16px; text-align: left; margin: 16px; border-radius: 8px; overflow-wrap: break-word;">
        ${error}
      </div>`;

      oDiv.innerHTML = `
      <div>
        <div style="margin-top: 2rem;">
          <span style="color: var(--primary-400); font-weight: 800;">GDLauncher</span> couldn't launch
        </div>
        <div style="font-size: 1rem; margin-top: 16px; margin-bottom: 16px; display: flex; justify-content: center; gap: 2rem;">
          <div>Cannot load module "${moduleName}"</div>
          <div style="font-weight: 200">v${__APP_VERSION__}</div>
        </div>
      </div>
      <div style="font-weight: 300; font-size: 1rem; padding: 16px; text-align: left;">
        This is awkward. Depending on the issue, there might be multiple solutions.
        <div>
          <ul style="margin-top: 16px; padding-left: 0; text-align: left; list-style-type: none; text-wrap: balance;">
            <li>- Try to restart GDLauncher.</li>
            <li>- Try to restart your computer.</li>
            <li>- Try to reinstall GDLauncher.</li>
            <li>- Join our <a id="discord-link" style="color: #7289d9; font-weight: 600; cursor: pointer;">Discord</a> and ask for help.</li>
            <li>- Delete the core module database at
              <div style="margin-left: 24px; font-style: italic;">
                ${pathJoin(runtimePath, "gdl_conf.db")}
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div style="font-size: 1rem; text-align: left; padding: 16px;">
        <div>User data: <span style="font-weight: 300; font-style: italic;">${userData}</span></div>
        <div>Initial runtime path: <span style="font-weight: 300; font-style: italic;">${initialRuntimePath}</span></div>
        <div>Runtime path: <span style="font-weight: 300; font-style: italic;">${runtimePath}</span></div>
      </div>
      ${errorText}`;

      const discordLink = document.querySelector("#discord-link")!;

      discordLink.addEventListener("click", () => {
        ipcRenderer.invoke(
          "openExternalLink",
          "https://discord.gdlauncher.com"
        );
      });
    }
  };
}

const { fatalError } = useLoading();

(async () => {
  await domReady();
  oDiv = document.querySelector("#appFatalCrash")!;
})();

// --------- Expose some API to the Renderer process. ---------
contextBridge.exposeInMainWorld("fatalError", fatalError);
