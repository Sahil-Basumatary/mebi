// Clerk injects its own stylesheet after Tailwind, so plain utilities lose the
// cascade. The trailing `!` (Tailwind v4 important) is required for our dark
// overrides to actually win against Clerk defaults on the auth screens.
export const authAppearance = {
  variables: {
    borderRadius: "0px",
    colorBackground: "transparent",
    colorPrimary: "#4d8fd6",
    fontFamily: "var(--font-roboto), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    card: "mx-auto w-full border-0! bg-transparent! p-0! shadow-none!",
    cardBox: "w-full border-0! bg-transparent! shadow-none!",
    header: "hidden!",
    main: "gap-4!",
    socialButtons: "gap-3!",
    socialButtonsBlockButton:
      "h-12! rounded-none! border! border-[#2a2a2a]! bg-[#141414]! text-[#ffffff]! shadow-none! transition-colors! hover:bg-[#1d1d1d]!",
    socialButtonsBlockButtonText: "font-medium! text-[#ededed]!",
    dividerLine: "bg-[#262626]!",
    dividerText: "text-[#6f6f6f]!",
    formFieldLabel: "text-[#b5b5b5]!",
    formFieldInput:
      "h-12! rounded-none! border! border-[#2a2a2a]! bg-[#141414]! px-4! text-[#ffffff]! shadow-none! placeholder:text-[#5f5f5f]! focus:border-[#4d8fd6]!",
    formFieldInputShowPasswordButton: "text-[#9a9a9a]! hover:text-[#ffffff]!",
    formButtonPrimary:
      "h-12! rounded-none! bg-[#4d8fd6]! text-[#ffffff]! shadow-none! transition-colors! hover:bg-[#3a7bc4]! after:hidden!",
    formFieldAction: "text-[#4d8fd6]! hover:text-[#6ba8e8]!",
    identityPreviewEditButton: "text-[#d8d8d8]! hover:text-[#ffffff]!",
    footer: "hidden!",
    footerAction: "hidden!",
  },
};
