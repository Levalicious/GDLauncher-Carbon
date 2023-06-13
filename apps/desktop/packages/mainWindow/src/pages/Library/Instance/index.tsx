/* eslint-disable i18next/no-literal-string */
import getRouteIndex from "@/route/getRouteIndex";
import { Trans } from "@gd/i18n";
import { Tabs, TabList, Tab, Button } from "@gd/ui";
import {
  Link,
  Outlet,
  useLocation,
  useParams,
  useRouteData,
} from "@solidjs/router";
import { For, Match, Show, Switch, createEffect, createSignal } from "solid-js";
import { useGDNavigate } from "@/managers/NavigationManager";
import { queryClient, rspc } from "@/utils/rspcClient";
import fetchData from "./instance.data";
import { formatDistance } from "date-fns";
import { InstanceDetails, UngroupedInstance } from "@gd/core_module/bindings";
import { getPreparingState, getRunningState } from "@/utils/instances";
import DefaultImg from "/assets/images/default-instance-img.png";

type InstancePage = {
  label: string;
  path: string;
};

const Instance = () => {
  const navigate = useGDNavigate();
  const params = useParams();
  const location = useLocation();
  const [editableName, setEditableName] = createSignal(false);
  const [isFavorite, setIsFavorite] = createSignal(false);
  const routeData: ReturnType<typeof fetchData> = useRouteData();
  const [newName, setNewName] = createSignal(
    routeData.instanceDetails.data?.name || ""
  );

  const setFavoriteMutation = rspc.createMutation(["instance.setFavorite"], {
    onMutate: async (
      obj
    ): Promise<
      | {
          instancesUngrouped: UngroupedInstance[];
          instanceDetails: InstanceDetails;
        }
      | undefined
    > => {
      await queryClient.cancelQueries({
        queryKey: ["instance.getInstanceDetails", parseInt(params.id, 10)],
      });
      await queryClient.cancelQueries({
        queryKey: ["instance.getInstancesUngrouped"],
      });

      const instancesUngrouped: UngroupedInstance[] | undefined =
        queryClient.getQueryData(["instance.getInstancesUngrouped"]);

      const instanceDetails: InstanceDetails | undefined =
        queryClient.getQueryData([
          "instance.getInstanceDetails",
          parseInt(params.id, 10),
        ]);

      queryClient.setQueryData(
        ["instance.getInstanceDetails", parseInt(params.id, 10)],
        (old: InstanceDetails | undefined) => {
          const newDetails = old;
          if (newDetails) newDetails.favorite = obj.favorite;
          if (newDetails) return newDetails;
          else return old;
        }
      );

      if (instancesUngrouped && instanceDetails)
        return { instancesUngrouped, instanceDetails };
    },
    onSettled() {
      queryClient.invalidateQueries({
        queryKey: ["instance.getInstanceDetails", parseInt(params.id, 10)],
      });
      queryClient.invalidateQueries({
        queryKey: ["instance.getInstancesUngrouped"],
      });
      setIsFavorite((prev) => !prev);
    },
    onError(
      _error,
      _variables,
      context:
        | {
            instancesUngrouped: UngroupedInstance[];
            instanceDetails: InstanceDetails;
          }
        | undefined
    ) {
      if (context?.instanceDetails) {
        setIsFavorite(context.instanceDetails.favorite);
        queryClient.setQueryData(
          ["instance.getInstanceDetails"],
          context.instanceDetails
        );
      }
    },
  });

  createEffect(() => {
    if (routeData.instanceDetails.data)
      setIsFavorite(routeData.instanceDetails.data?.favorite);
  });

  const instancePages = () => [
    {
      label: "Overview",
      path: `/library/${params.id}`,
    },

    ...(routeData.instanceDetails.data?.modloaders[0]?.type_
      ? [
          {
            label: "Mods",
            path: `/library/${params.id}/mods`,
          },
        ]
      : []),
    {
      label: "Settings",
      path: `/library/${params.id}/settings`,
    },
    // {
    //   label: "Resource Packs",
    //   path: `/library/${params.id}/resourcepacks`,
    // },
    // {
    //   label: "Screenshots",
    //   path: `/library/${params.id}/screenshots`,
    // },
    // {
    //   label: "Versions",
    //   path: `/library/${params.id}/versions`,
    // },
  ];

  const selectedIndex = () =>
    getRouteIndex(instancePages(), location.pathname, true);

  const launchInstanceMutation = rspc.createMutation([
    "instance.launchInstance",
  ]);

  const updateInstanceMutation = rspc.createMutation([
    "instance.updateInstance",
  ]);

  const killInstanceMutation = rspc.createMutation(["instance.killInstance"]);

  const getInstanceDetailsQuery = rspc.createQuery(() => [
    "instance.getInstanceDetails",
    parseInt(params.id, 10),
  ]);

  const isRunning = () =>
    getInstanceDetailsQuery.data?.state &&
    getRunningState(getInstanceDetailsQuery.data?.state);

  const isPreparing = () =>
    getInstanceDetailsQuery.data?.state &&
    getPreparingState(getInstanceDetailsQuery.data?.state);

  // let containerRef: HTMLDivElement;
  // let bgRef: HTMLDivElement;
  // let innerContainerRef: HTMLDivElement;
  // let refStickyContainer: HTMLDivElement;

  const handleNameChange = () => {
    if (newName()) {
      updateInstanceMutation.mutate({
        name: { Set: newName() },
        use_loaded_icon: null,
        memory: null,
        notes: null,
        instance: parseInt(params.id, 10),
      });
    }
    setEditableName(false);
  };

  let nameRef: HTMLHeadingElement | undefined;

  return (
    <div
      class="relative h-full bg-darkSlate-800 overflow-auto max-h-full overflow-x-hidden"
      style={{
        "scrollbar-gutter": "stable",
      }}
      // onScroll={(e) => {
      //   if (e.currentTarget.scrollTop > 50) {
      //     innerContainerRef.style.opacity = "0";
      //     containerRef.classList.remove("h-52");
      //     containerRef.classList.add("h-0");

      //     bgRef.classList.add("bg-darkSlate-900");

      //     refStickyContainer.classList.remove("h-0", "opacity-0");
      //     refStickyContainer.classList.add("h-20", "sticky", "top-0");
      //   } else {
      //     innerContainerRef.style.opacity = "1";
      //     containerRef.classList.add("h-52");
      //     containerRef.classList.remove("h-0");

      //     bgRef.classList.remove("bg-darkSlate-900");

      //     refStickyContainer.classList.add("h-0", "opacity-0");
      //     refStickyContainer.classList.remove("h-20", "sticky", "top-0");
      //   }
      // }}
    >
      <div
        class="relative flex flex-col justify-between ease-in-out transition-all h-52 items-stretch"
        // ref={(el) => {
        //   containerRef = el;
        // }}
      >
        <div
          class="h-full absolute left-0 right-0 top-0 bg-cover bg-center bg-fixed bg-no-repeat"
          style={{
            "background-image": routeData.image()
              ? `url("${routeData.image()}")`
              : `url("${DefaultImg}")`,
            "background-position": routeData.image() ? "right-5rem" : "bottom",
          }}
          // ref={(el) => {
          //   bgRef = el;
          // }}
        />
        <div
          class="h-full"
          // ref={(el) => {
          //   innerContainerRef = el;
          // }}
        >
          <div class="z-10 sticky top-5 left-5 w-fit">
            <Button
              onClick={() => navigate("/library")}
              icon={<div class="text-2xl i-ri:arrow-drop-left-line" />}
              size="small"
              type="transparent"
            >
              <Trans
                key="instance.step_back"
                options={{
                  defaultValue: "Back",
                }}
              />
            </Button>
          </div>
          <div
            class="flex justify-center sticky h-24 top-52 z-20 px-6"
            style={{
              background:
                "linear-gradient(180deg, rgba(29, 32, 40, 0) 0%, #1D2028 100%)",
            }}
          >
            <div class="flex justify-center w-full">
              <div class="flex justify-between w-full max-w-185 items-end">
                <div class="flex flex-col gap-4 w-full lg:flex-row justify-end">
                  <div
                    class="bg-center bg-cover h-16 w-16 rounded-xl"
                    style={{
                      "background-image": routeData.image()
                        ? `url("${routeData.image()}")`
                        : `url("${DefaultImg}")`,
                    }}
                  />

                  <div class="flex flex-col max-w-185 flex-1">
                    <div
                      class="flex gap-4 items-center w-fit pl-1"
                      classList={{
                        "border-2 border-darkSlate-800 border-solid rounded-lg bg-darkSlate-700":
                          editableName(),
                        "border-2 border-transparent border-solid rounded-lg":
                          !editableName(),
                      }}
                    >
                      <span class="flex gap-2 cursor-pointer">
                        <h1
                          ref={nameRef}
                          onInput={(e) => {
                            setNewName(e.target.innerHTML);
                          }}
                          class="m-0 border-box cursor-pointer z-10 focus-visible:border-0 focus:outline-none focus-visible:outline-none cursor-text"
                          contentEditable={editableName()}
                          onFocusIn={() => {
                            setEditableName(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleNameChange();
                            }
                          }}
                        >
                          {routeData.instanceDetails.data?.name}
                        </h1>
                        <Show when={!editableName()}>
                          <div
                            class="i-ri:pencil-fill hover:text-darkSlate-50 transition-color ease-in-out duration-100"
                            onClick={() => setEditableName(true)}
                          />
                        </Show>
                      </span>
                      <div
                        class="relative flex items-center gap-2 h-full pr-2"
                        classList={{ "bg-darkSlate-800 pl-2": editableName() }}
                      >
                        <div
                          class="cursor-pointer ease-in-out text-white transition i-ri:check-fill text-3xl z-10 duration-50 hover:text-green-500"
                          classList={{
                            hidden: !editableName(),
                          }}
                          onClick={() => handleNameChange()}
                        />
                        <div
                          class="cursor-pointer ease-in-out text-white transition i-ri:close-fill text-3xl duration-50 hover:text-red-500 z-10"
                          classList={{
                            hidden: !editableName(),
                          }}
                          onClick={() => {
                            if (
                              routeData.instanceDetails.data?.name &&
                              nameRef
                            ) {
                              setNewName(routeData.instanceDetails.data?.name);
                              nameRef.innerHTML =
                                routeData.instanceDetails.data?.name;
                            }
                            setEditableName(false);
                          }}
                        />
                      </div>
                    </div>
                    <div class="flex flex-col lg:flex-row justify-between cursor-default">
                      <div class="flex flex-col lg:flex-row text-darkSlate-50 gap-1 items-start lg:items-center lg:gap-0">
                        <div class="m-0 flex gap-2 p-0 lg:pr-4 border-0 lg:border-r-2 border-darkSlate-500">
                          <span>
                            {routeData.instanceDetails.data?.modloaders[0]
                              ?.type_ || "Vanilla"}
                          </span>
                          <span>{routeData.instanceDetails.data?.version}</span>
                        </div>
                        <div class="p-0 border-0 lg:border-r-2 border-darkSlate-500 flex gap-2 items-center lg:px-4">
                          <div class="i-ri:time-fill" />
                          <span>
                            {formatDistance(
                              new Date(
                                routeData.instanceDetails.data?.last_played ||
                                  Date.now()
                              ).getTime(),
                              Date.now()
                            )}
                          </span>
                        </div>
                        <div class="p-0 lg:px-4 flex gap-2 items-center">
                          <div class="i-ri:user-fill" />
                          ATMTeam
                        </div>
                      </div>
                      <div class="flex items-center gap-2 mt-2 lg:mt-0">
                        {/* <div
                          class="flex justify-center items-center rounded-full h-8 w-8"
                          style={{
                            background: "rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          <div class="i-ri:more-2-fill text-xl" />
                        </div> */}
                        <div
                          class="rounded-full h-8 flex justify-center items-center cursor-pointer w-8"
                          style={{
                            background: "rgba(255, 255, 255, 0.1)",
                          }}
                          onClick={() =>
                            setFavoriteMutation.mutate({
                              instance: parseInt(params.id, 10),
                              favorite:
                                !routeData.instanceDetails.data?.favorite,
                            })
                          }
                        >
                          <div
                            class="text-xl"
                            classList={{
                              "text-yellow-500 i-ri:star-s-fill": isFavorite(),
                              "i-ri:star-line": !isFavorite(),
                            }}
                          />
                        </div>
                        <Button
                          uppercase
                          type="glow"
                          size="large"
                          variant={isRunning() && "red"}
                          loading={isPreparing() !== undefined}
                          onClick={() => {
                            if (isRunning()) {
                              killInstanceMutation.mutate(
                                parseInt(params.id, 10)
                              );
                            } else {
                              launchInstanceMutation.mutate(
                                parseInt(params.id, 10)
                              );
                            }
                          }}
                        >
                          <Switch>
                            <Match when={!isRunning()}>
                              <Trans
                                key="instance.play"
                                options={{
                                  defaultValue: "play",
                                }}
                              />
                            </Match>
                            <Match when={isRunning()}>
                              <Trans
                                key="instance.stop"
                                options={{
                                  defaultValue: "stop",
                                }}
                              />
                            </Match>
                          </Switch>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        class="flex gap-4 justify-center items-center w-full z-20 ease-in-out px-4 box-border bg-darkSlate-900 h-0 opacity-0 transition-height duration-200"
        // ref={(el) => {
        //   refStickyContainer = el;
        // }}
      >
        <div class="flex items-start w-full ease-in-out transition-opacity duration-300">
          <div class="w-fit justify-center items-center transition ease-in-out duration-100 h-fit mr-4">
            <Button
              onClick={() => navigate("/library")}
              icon={<div class="i-ri:arrow-drop-left-line text-2xl" />}
              size="small"
              type="transparent"
            >
              <Trans
                key="instance.step_back"
                options={{
                  defaultValue: "Back",
                }}
              />
            </Button>
          </div>
          <div class="flex flex-1 flex-col max-w-185">
            <h4 class="m-0"> {routeData.instanceDetails.data?.name}</h4>
            <div class="flex flex-col lg:flex-row justify-between">
              <div class="flex items-start lg:items-center flex-col gap-1 lg:gap-0 lg:flex-row text-darkSlate-50">
                <div class="flex gap-2 p-0 border-0 lg:border-r-2 border-darkSlate-500 text-xs lg:pr-2">
                  <span>
                    {routeData.instanceDetails.data?.modloaders[0]?.type_ ||
                      "Vanilla"}
                  </span>
                  <span>{routeData.instanceDetails.data?.version}</span>
                </div>
                <div class="text-xs p-0 border-0 lg:border-r-2 border-darkSlate-500 flex gap-2 items-center lg:px-2">
                  <div class="i-ri:time-fill" />
                  <span>
                    {formatDistance(
                      new Date(
                        routeData.instanceDetails.data?.last_played ||
                          Date.now()
                      ).getTime(),
                      Date.now()
                    )}
                  </span>
                </div>
                <div class="text-xs p-0 lg:px-2 flex gap-2 items-center">
                  <div class="i-ri:user-fill" />
                  ATMTeam
                </div>
              </div>
              <div class="flex items-center gap-2 mt-2 lg:mt-0 z-10">
                {/* <div
                  class="rounded-full w-8 h-8 flex justify-center items-center"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div class="i-ri:more-2-fill text-xl" />
                </div> */}
                <div
                  class="rounded-full w-8 h-8 flex justify-center items-center cursor-pointer"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div
                    class="text-xl"
                    classList={{
                      "text-yellow-500 i-ri:star-s-fill": isFavorite(),
                      "i-ri:star-line": !isFavorite(),
                    }}
                    onClick={() =>
                      setFavoriteMutation.mutate({
                        instance: parseInt(params.id, 10),
                        favorite: !routeData.instanceDetails.data?.favorite,
                      })
                    }
                  />
                </div>
                <Button
                  uppercase
                  type="glow"
                  size="small"
                  variant={isRunning() && "red"}
                  loading={isPreparing() !== undefined}
                  onClick={() => {
                    if (isRunning()) {
                      killInstanceMutation.mutate(parseInt(params.id, 10));
                    } else {
                      launchInstanceMutation.mutate(parseInt(params.id, 10));
                    }
                  }}
                >
                  <Switch>
                    <Match when={!isRunning()}>
                      <Trans
                        key="instance.play"
                        options={{
                          defaultValue: "play",
                        }}
                      />
                    </Match>
                    <Match when={isRunning()}>
                      <Trans
                        key="instance.stop"
                        options={{
                          defaultValue: "stop",
                        }}
                      />
                    </Match>
                  </Switch>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-darkSlate-800">
        <div class="flex justify-center p-6">
          <div class="bg-darkSlate-800 max-w-full w-185">
            <div class="sticky z-20 flex flex-col bg-darkSlate-800 mb-4 top-20">
              <Tabs index={selectedIndex()}>
                <TabList>
                  <For each={instancePages()}>
                    {(page: InstancePage) => (
                      <Link href={page.path} class="no-underline">
                        <Tab class="bg-transparent">{page.label}</Tab>
                      </Link>
                    )}
                  </For>
                </TabList>
              </Tabs>
            </div>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Instance;
