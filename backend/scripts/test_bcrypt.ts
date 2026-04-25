import bcrypt from "bcryptjs";

async function test() {
  const match = await bcrypt.compare("Aequs@2026", "$2b$10$vKc62rnF0lbZu/mXcij4OeIV3.wxlJbqV7bjWGTz/dc8pjm.idsuy");
  console.log("MATCH:", match);
}
test();
