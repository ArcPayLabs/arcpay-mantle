# ArcPay Mantle Privacy Intent Circuit

This is the circuit-ready path for the next Mantle privacy upgrade.

Current live privacy is handled by `MantlePrivacyVault` on Mantle Sepolia:
commitment IDs, encrypted memo URIs, delayed recipient release, cancellation,
refund, and one-time nullifier evidence.

Do not claim a full ZK privacy verifier until these steps are completed:

```bash
nargo check
nargo execute
bb prove -b ./target/mantle_privacy_intent.json -w ./target/mantle_privacy_intent.gz -o ./proofs
bb write_vk -b ./target/mantle_privacy_intent.json -o ./proofs
bb write_solidity_verifier -k ./proofs/vk -o ./proofs/MantlePrivacyIntentVerifier.sol
```

After that, deploy the generated verifier to Mantle Sepolia and attach the
transaction hash to ArcPay proofs before marketing the flow as full ZK.
