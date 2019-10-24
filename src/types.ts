export type StyleType = "line" | "side";
export type SummaryType = "closed" | "open" | "hidden";
export type LineMatchingType = "lines" | "words" | "none";
export type FormatType = "html" | "json";
export type InputType = "file" | "command" | "stdin";
export type OutputType = "preview" | "stdout";
export type DiffyType = "browser" | "pbcopy" | "print";

export interface Configuration {
  synchronisedScroll: boolean;
  showFilesOpen: boolean;
  formatType: FormatType;
  outputDestinationType: OutputType;
  outputDestinationFile?: string;
  inputSource: InputType;
  diffyType?: DiffyType;
  htmlWrapperTemplate: string;
  ignore: string[];
  coverage: string;
  coverageFilePatterns: string;
}
