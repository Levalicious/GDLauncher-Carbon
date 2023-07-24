import { ModRowProps, getCategories, isCurseForgeData } from "@/utils/Mods";
import { Accessor, For, Match, Show, Switch } from "solid-js";
import { Tag, Tooltip } from "@gd/ui";
import {
  CFFECategory,
  MRFECategoriesResponse,
  MRFECategory,
} from "@gd/core_module/bindings";
import { CategoryIcon } from "@/utils/instances";

type Props = {
  modProps: ModRowProps;
  isRowSmall: Accessor<boolean>;
  modrinthCategories: MRFECategoriesResponse | undefined;
};

const Categories = (props: Props) => {
  // const modrinthIcon = () =>
  return (
    <div class="flex gap-2 scrollbar-hide">
      <Switch>
        <Match
          when={!props.isRowSmall() && getCategories(props.modProps).length < 5}
        >
          <For each={getCategories(props.modProps)}>
            {(tag) => (
              <Tooltip
                content={
                  isCurseForgeData(props.modProps.data)
                    ? (tag as CFFECategory).name
                    : (tag as string)
                }
              >
                <Tag
                  img={
                    isCurseForgeData(props.modProps.data) ? (
                      (tag as CFFECategory).iconUrl
                    ) : (
                      <Switch fallback={tag as string}>
                        <Match
                          when={props.modrinthCategories?.find(
                            (category) => category.name === tag
                          )}
                        >
                          <CategoryIcon
                            category={
                              props.modrinthCategories?.find(
                                (category) => category.name === tag
                              ) as MRFECategory
                            }
                          />
                        </Match>
                      </Switch>
                    )
                  }
                  type="fixed"
                />
              </Tooltip>
            )}
          </For>
        </Match>
        <Match
          when={props.isRowSmall() || getCategories(props.modProps).length >= 5}
        >
          <Tooltip
            content={
              isCurseForgeData(props.modProps.data)
                ? (getCategories(props.modProps)?.[0] as CFFECategory)?.name
                : (getCategories(props.modProps)?.[0] as string)
            }
          >
            <Tag
              img={
                isCurseForgeData(props.modProps.data) ? (
                  (getCategories(props.modProps)?.[0] as CFFECategory)?.iconUrl
                ) : (
                  <Show
                    fallback={getCategories(props.modProps)?.[0] as string}
                    when={props.modrinthCategories?.find(
                      (category) =>
                        category.name ===
                        (getCategories(props.modProps)?.[0] as string)
                    )}
                  >
                    <CategoryIcon
                      category={
                        props.modrinthCategories?.find(
                          (category) =>
                            category.name ===
                            (getCategories(props.modProps)?.[0] as string)
                        ) as MRFECategory
                      }
                    />
                  </Show>
                )
              }
              type="fixed"
            />
          </Tooltip>
          <Show when={getCategories(props.modProps).length - 1 > 0}>
            <Tooltip
              content={
                <div class="flex">
                  <Switch>
                    <Match when={isCurseForgeData(props.modProps.data)}>
                      <For each={getCategories(props.modProps).slice(1)}>
                        {(tag) => (
                          <Tag
                            img={(tag as CFFECategory).iconUrl}
                            name={(tag as CFFECategory).name}
                            type="fixed"
                          />
                        )}
                      </For>
                    </Match>
                    <Match when={!isCurseForgeData(props.modProps.data)}>
                      <For each={getCategories(props.modProps).slice(1)}>
                        {(tag) => (
                          <Tag
                            img={
                              <Show
                                when={props.modrinthCategories?.find(
                                  (category) => category.name === tag
                                )}
                              >
                                <CategoryIcon
                                  category={
                                    props.modrinthCategories?.find(
                                      (category) => category.name === tag
                                    ) as MRFECategory
                                  }
                                />
                              </Show>
                            }
                            name={tag as string}
                            type="fixed"
                          />
                        )}
                      </For>
                    </Match>
                  </Switch>
                </div>
              }
            >
              <Tag
                name={`+${getCategories(props.modProps).length - 1}`}
                type="fixed"
              />
            </Tooltip>
          </Show>
        </Match>
      </Switch>
    </div>
  );
};

export default Categories;
