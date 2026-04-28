import { syncAdapterContract } from "@clear-progress/contract/tests/contracts";
import { InMemorySyncAdapter } from "../src";

syncAdapterContract(async () => new InMemorySyncAdapter());
