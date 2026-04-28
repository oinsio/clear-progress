import { syncAdapterContract } from "@clear-progress/contract/contracts";
import { InMemorySyncAdapter } from "../src";

syncAdapterContract(async () => new InMemorySyncAdapter());
