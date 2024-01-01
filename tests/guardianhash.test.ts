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
      circuit = await wasm_tester(
        path.join(__dirname, "../circuits/guardianhash.circom"),
        {
          // @dev During development recompile can be set to false if you are only making changes in the tests.
          // This will save time by not recompiling the circuit every time.
          // Compile: circom "./tests/email-verifier-test.circom" --r1cs --wasm --sym --c --wat --output "./tests/compiled-test-circuit"
          recompile: true,
          output: path.join(__dirname, "./compiled-test-circuit"),
          include: path.join(__dirname, "../node_modules"),
        }
      );
    });

    it("should main be ok", async function () {
      // signature
      const jwtSignature =
        "NHVaYe26MbtOYhSKkoKYdFVomg4i8ZJd8_-RU8VNbftc4TSMb4bXP3l3YlNWACwyXPGffz5aXHc6lty1Y2t4SWRqGteragsVdZufDn5BlnJl9pdR_kdVFUsra2rWKEofkZeIC4yWytE58sMIihvo9H1ScmmVwBcQP6XETqYd0aSHp1gOa9RdUPDvoXQ5oqygTqVtxaDr6wUFKrKItgBMzWIdNZ6y7O9E0DhEPTbE9rfBo6KTFsHAZnMg4k68CDp2woYIaXbmYTWcvbzIuHO7_37GT79XdIwkm95QJ7hYC9RiwrV7mesbY4PAahERJawntho0my942XheVLmGwLMBkQ";
      // eslint-disable-next-line prettier/prettier, no-restricted-globals
      const signatureBigInt = BigInt(
        "0x" + Buffer.from(jwtSignature, "base64").toString("hex")
      );

      // public key
      const publicKeyPem = fs.readFileSync(
        path.join(__dirname, "./keys/public_key.pem"),
        "utf8"
      );
      const pubKeyData = pki.publicKeyFromPem(publicKeyPem.toString());
      const pubkeyBigInt = BigInt(pubKeyData.n.toString());

      const startTime = new Date().getTime();
      const witness = await circuit.calculateWitness({
        jwt: padString(
          "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0",
          512
        ),
        signature: toCircomBigIntBytes(signatureBigInt),
        pubkey: toCircomBigIntBytes(pubkeyBigInt),
        salt: Array.from(hexToBytes("a677999396dc49a28ad6c9c242719bb3"), (b) => b),
      });

      // Sub is "1234567890"
      const bytes = hexToBytes("7f0bdbbd5bc4c68c21afe63067d39bbc863432cec2c56b9d351cad89346a8b47");

      await circuit.checkConstraints(witness);
      await circuit.assertOut(witness, {
        out: [...bytes],
      });
    });
  });
});
