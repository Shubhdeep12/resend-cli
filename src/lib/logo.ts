import pc from "picocolors";

const LINES = [
  "   ██████╗ ███████╗███████╗███████╗███╗   ██╗██████╗ ",
  "   ██╔══██╗██╔════╝██╔════╝██╔════╝████╗  ██║██╔══██╗",
  "   ██████╔╝█████╗  ███████╗█████╗  ██╔██╗ ██║██║  ██║",
  "   ██╔══██╗██╔══╝  ╚════██║██╔══╝  ██║╚██╗██║██║  ██║",
  "   ██║  ██║███████╗███████║███████╗██║ ╚████║██████╔╝",
  "   ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═══╝╚═════╝ ",
];

export function printWelcome(version: string): void {
  // Sleek minimalist gradient: bright white fading into subtle dark gray
  const colors = [
    (text: string) => pc.white(pc.bold(text)),
    (text: string) => pc.white(text),
    (text: string) => pc.gray(pc.bold(text)),
    (text: string) => pc.gray(text),
    (text: string) => pc.dim(pc.gray(text)),
    (text: string) => pc.dim(pc.gray(text)),
  ];

  console.log();
  for (let i = 0; i < LINES.length; i++) {
    const colorFn = colors[i];
    console.log(`  ${colorFn(LINES[i])}`);
  }
  console.log();

  console.log(
    `  ${pc.dim(`v${version}`)} ${pc.dim("—")} ${pc.white("Power your emails with code")}`,
  );
  console.log();
  console.log(
    `  Run ${pc.cyan("resend --help")} to see all available commands.`,
  );
  console.log();
}
