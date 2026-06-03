import type { Theme } from "../types";

export const omnitabDefault: Theme = {
  id: "omnitab-default",
  name: "OmniTab Default",
  description: "The default OmniTab look — clean glass over neutral surfaces.",
  editorTheme: { dark: "atomone", light: "atomone" },
  variants: {
    light: {},
    dark: {},
  },
};
