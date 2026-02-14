import { modalTheme } from "flowbite-react";

export const lightModalTheme = {
  ...modalTheme,
  content: {
    ...modalTheme.content,
    inner:
      "relative flex max-h-[90dvh] flex-col rounded-xl border border-gray-200 !bg-white shadow-sm",
  },
  header: {
    ...modalTheme.header,
    base: "flex items-start justify-between rounded-t-xl border-b border-gray-200 p-5",
    title: "text-xl font-semibold !text-gray-900",
    close: {
      ...modalTheme.header.close,
      base: "ms-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-100 hover:text-gray-900",
    },
  },
  body: {
    ...modalTheme.body,
    base: "flex-1 overflow-auto p-6 !text-gray-900",
  },
  footer: {
    ...modalTheme.footer,
    base: "flex items-center justify-end gap-3 rounded-b-xl border-t border-gray-200 p-6",
  },
};
