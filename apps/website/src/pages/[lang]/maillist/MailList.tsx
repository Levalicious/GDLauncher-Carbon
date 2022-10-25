import Button from "@/components/Button";
import Input from "@/components/Input";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ADD_USER_ENDPOINT } from "@/constants";
import { useTranslations } from "@/i18n/utils";
import { createSignal, Show } from "solid-js";
import { useForm } from "../../../components/useForm";

const WaitList = ({ pathname }: { pathname: string }) => {
  const { form, updateFormField } = useForm();
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [success, setSuccess] = createSignal("");
  const t = useTranslations(pathname);

  const addUser = async (body: any) => {
    return await fetch(ADD_USER_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    const obj: any = {};
    setError("");
    setSuccess("");
    setLoading(true);

    if (form.email && form.emailMc && form.emailKofi) {
      obj["user_email"] = form.email;

      const res = await addUser(obj);
      console.log("res", res.status, res);
      if (res.status === 401) {
        setError(t("maillist.error_401"));
      } else if (res.status === 400) {
        setError(t("maillist.error_400"));
      } else if (res.status === 200) {
        setSuccess(t("maillist.success"));
      }
    } else {
      setError(t("maillist.error_missing_info"));
    }
    setLoading(false);
  };

  return (
    <div class="pt-10 lg:h-screen relative flex flex-col justify-center items-center">
      <div class="flex flex-col justify-center items-center gap-10 max-w-xs lg:max-w-5xl text-center lg:pt-24">
        <h1 class="flex flex-col lg:block text-4xl lg:text-7xl font-bold ">
          {t("maillist.title")}
          <span class="inline-block px-4 text-yellow-500 -rotate-12 hover:rotate-0 transition-transform underline">
            {t("maillist.title2")}
          </span>
          {t("maillist.title3")}
        </h1>
        <p class="text-xl lg:text-3xl font-thin max-w-xs lg:max-w-4xl">
          {t("maillist.text")}
        </p>
        <form onSubmit={handleSubmit} method="post">
          <div class="flex flex-col justify-center items-center gap-10">
            <div class="flex flex-col gap-10">
              <Input
                placeholder={t("maillist.email")}
                type="email"
                value={form.email}
                onChange={updateFormField("email")}
              />
              <Button class="min-w-[260px] border-none transition duration-150 box-shadow-button hover:box-shadow-button-hover active:box-shadow-button-active">
                <>
                  <Show when={loading()}>
                    <LoadingSpinner />
                  </Show>
                  {t("maillist.getAccess")}
                </>
              </Button>
            </div>
            <div class="h-[100px]">
              <Show when={error()}>
                <div class="p-10 text-red-400">{error()}</div>
              </Show>
              <Show when={success()}>
                <div class="p-10 text-green-400">{success()}</div>
              </Show>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WaitList;
