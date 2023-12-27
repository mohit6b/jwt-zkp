import fs from "fs";
import path from "path";
import { pki } from "node-forge";
import { wasm as wasm_tester } from "circom_tester";
import { describe, beforeAll, it } from "vitest";
import { hexToBytes, padString, toCircomBigIntBytes } from "../utils";

describe("Guardian Hash Test", () => {
  let circuit: any;

  describe("Guardian Hash Test", () => {
    beforeAll(async () => {
      circuit = await wasm_tester(path.join(__dirname, "../circuits/guardianhash.circom"), {
        recompile: true,
        output: path.join(__dirname, "./compiled-test-circuit"),
        include: path.join(__dirname, "../node_modules"),
      });
    });

    it("should main be ok", async function () {
      // signature
      const jwtSignature =
        "NHVaYe26MbtOYhSKkoKYdFVomg4i8ZJd8_-RU8VNbftc4TSMb4bXP3l3YlNWACwyXPGffz5aXHc6lty1Y2t4SWRqGteragsVdZufDn5BlnJl9pdR_kdVFUsra2rWKEofkZeIC4yWytE58sMIihvo9H1ScmmVwBcQP6XETqYd0aSHp1gOa9RdUPDvoXQ5oqygTqVtxaDr6wUFKrKItgBMzWIdNZ6y7O9E0DhEPTbE9rfBo6KTFsHAZnMg4k68CDp2woYIaXbmYTWcvbzIuHO7_37GT79XdIwkm95QJ7hYC9RiwrV7mesbY4PAahERJawntho0my942XheVLmGwLMBkQ";
      
      // Convert base64 to hex and then to BigInt
      const signatureHex = Buffer.from(jwtSignature, "base64").toString("hex");
      const signatureBigInt = BigInt("0x" + signatureHex);

      // public key
      const publicKeyPem = fs.readFileSync(path.join(__dirname, "./keys/public_key.pem"), "utf8");
      const pubKeyData = pki.publicKeyFromPem(publicKeyPem.toString());
      const pubkeyBigInt = BigInt(pubKeyData.n.toString());

      // padString function
      const paddedJwt = padString(
        "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0",
        512
      );

      const startTime = new Date().getTime();
      const witness = await circuit.calculateWitness({
        jwt: paddedJwt,
        signature: toCircomBigIntBytes(signatureBigInt),
        pubkey: toCircomBigIntBytes(pubkeyBigInt),
        salt: padString("a677999396dc49a28ad6c9c242719bb3", 32),
      });
      console.log("duration:", new Date().getTime() - startTime);

      // Assuming hexToBytes is correctly implemented
      const bytes = hexToBytes("5f313a06c37471dd1fb5e0c73adc6edf1ef2c099d2bff5479b49d7dccc662a6c");

      // Convert Uint8Array to Buffer
      const buffer = Buffer.from(bytes);

      // Convert Buffer to UTF-8 string
      const utf8String = buffer.toString('utf8');
      console.log(utf8String);

      const bytesBigInt = BigInt("0x" + Buffer.from(bytes).toString("hex"));
      console.log("bytesBigInt", bytesBigInt);
      
      // Check constraints and assert output
      let a = await circuit.checkConstraints(witness);
      console.log("checkin witness:", (witness));
      console.log("checkin bytes:", (bytes));

      await circuit.assertOut(witness, {
        out: [...utf8String],
      });
    });
  });
});
