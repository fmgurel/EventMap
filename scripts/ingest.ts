import { ingest } from "../src/lib/pipeline";

async function main() {
  const result = await ingest();
  console.log("Ingest done:", JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
