import { Command } from "@oclif/core";
import { logger } from "../utils";

export default class Serve extends Command {
  public async run(): Promise<void> {
    logger.info("Serve");
  }
}
