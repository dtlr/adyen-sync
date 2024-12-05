import { Command } from "@oclif/core";
import { logger } from "../../utils";

export class Serve extends Command {
  async run(): Promise<void> {
    logger.info("Serve");
  }
}
