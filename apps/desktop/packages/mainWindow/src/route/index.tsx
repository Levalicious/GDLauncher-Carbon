import { lazy } from "solid-js";
import { RouteDefinition } from "@solidjs/router";
import SettingsJavaData from "@/pages/Settings/settings.java.data";
import SettingsGeneralData from "@/pages/Settings/settings.general.data";
import LoginData from "@/pages/Login/auth.login.data";
import AppData from "@/pages/app.data";
import LibraryData from "@/pages/Library/library.data";
import InstanceData from "@/pages/Library/Instance/instance.data";
/* Defining the routes for the application. */

export const routes: RouteDefinition[] = [
  {
    path: "/",
    component: lazy(() => import("@/pages/Login")),
    data: LoginData,
  },
  {
    path: "/",
    component: lazy(() => import("@/pages/withAds")),
    data: AppData,
    children: [
      {
        path: "/library",
        component: lazy(() => import("@/pages/Library")),
        data: LibraryData,
        children: [
          {
            path: "/",
            component: lazy(() => import("@/pages/Library/Home")),
          },
          {
            path: "/:id",
            component: lazy(() => import("@/pages/Library/Instance")),
            data: InstanceData,
            children: [
              {
                path: "/",
                component: lazy(
                  () => import("@/pages/Library/Instance/Overview")
                ),
              },
              {
                path: "/mods",
                component: lazy(() => import("@/pages/Library/Instance/Mods")),
                data: () => {
                  console.log("Fetching mods data...");
                },
              },
              {
                path: "/settings",
                component: lazy(
                  () => import("@/pages/Library/Instance/Settings")
                ),
                data: () => {
                  console.log("Fetching instance settings data...");
                },
              },
              {
                path: "/resourcepacks",
                component: lazy(
                  () => import("@/pages/Library/Instance/ResourcePacks")
                ),
              },
              {
                path: "/screenshots",
                component: lazy(
                  () => import("@/pages/Library/Instance/Screenshots")
                ),
              },
              {
                path: "/versions",
                component: lazy(
                  () => import("@/pages/Library/Instance/Versions")
                ),
              },
            ],
          },
        ],
      },
      {
        path: "/modpacks",
        component: lazy(() => import("@/pages/Modpacks")),
        data: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10000));
          console.log("Fetching whatever data...");
          return {};
        },
        children: [
          {
            path: "/",
            component: lazy(() => import("@/pages/Modpacks/Browser")),
            data: () => {
              console.log("Fetching modpacks data...");
            },
          },
        ],
      },
      {
        path: "/modpacks/:id",
        component: lazy(() => import("@/pages/Modpacks/Explore")),
        data: () => {
          console.log("Fetching specific modpack data...");
        },
      },
      {
        path: "/settings",
        component: lazy(() => import("@/pages/Settings")),
        data: SettingsGeneralData,
        children: [
          {
            path: "/",
            component: lazy(() => import("@/pages/Settings/General")),
          },
          {
            path: "/appearance",
            component: lazy(() => import("@/pages/Settings/Appearance")),
          },
          {
            path: "/java",
            component: lazy(() => import("@/pages/Settings/Java")),
            data: SettingsJavaData,
          },
        ],
      },
      {
        path: "**",
        component: lazy(() => import("@/errors/404")),
      },
    ],
  },
];
