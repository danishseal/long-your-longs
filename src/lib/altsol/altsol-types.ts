/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/altsol.json`.
 */
export type Altsol = {
  "address": "C1q8mGfr8a5rfPbaCJ1mGpocsDJc1xXZxbX1adLAX4r9",
  "metadata": {
    "name": "altsol",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "buy",
      "discriminator": [
        102,
        6,
        61,
        18,
        1,
        218,
        235,
        234
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "launch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  97,
                  117,
                  110,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "launchAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "launch"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true,
          "relations": [
            "launch"
          ]
        },
        {
          "name": "quoteMint",
          "address": "So11111111111111111111111111111111111111112",
          "relations": [
            "launch"
          ]
        },
        {
          "name": "userSynthAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "launchQuoteAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "launchAuthority"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "quoteMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "crankerWsolAta",
          "docs": [
            "Cranker wSOL ATA — receives fee_bps × sol_in on every buy.",
            "Permissionless: anyone can fund the cranker; ATA's authority is BRIDGE_CRANKER."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "cranker"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "quoteMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "cranker",
          "address": "5BYyHQHe8CMcAMJogQpz2c9wukSSAZdhrsdnvSFwTVVx"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "buyParams"
            }
          }
        }
      ]
    },
    {
      "name": "graduate",
      "discriminator": [
        45,
        235,
        225,
        181,
        17,
        218,
        64,
        130
      ],
      "accounts": [
        {
          "name": "cranker",
          "writable": true,
          "signer": true
        },
        {
          "name": "launch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  97,
                  117,
                  110,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "launchAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "launch"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "launch"
          ]
        },
        {
          "name": "quoteMint",
          "relations": [
            "launch"
          ]
        },
        {
          "name": "launchQuoteAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "launchAuthority"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "quoteMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "harvest",
      "discriminator": [
        228,
        241,
        31,
        182,
        53,
        169,
        59,
        199
      ],
      "accounts": [
        {
          "name": "cranker",
          "writable": true,
          "signer": true
        },
        {
          "name": "pumpLaunch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  117,
                  109,
                  112,
                  95,
                  108,
                  97,
                  117,
                  110,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "pump_launch.pump_mint",
                "account": "pumpLaunch"
              }
            ]
          }
        },
        {
          "name": "launchAuthority",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  117,
                  109,
                  112,
                  95,
                  97,
                  117,
                  116,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "pumpLaunch"
              }
            ]
          }
        },
        {
          "name": "wsolMint",
          "address": "So11111111111111111111111111111111111111112"
        },
        {
          "name": "launchWsolAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "launchAuthority"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "wsolMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "harvestParams"
            }
          }
        }
      ]
    },
    {
      "name": "initLaunch",
      "discriminator": [
        75,
        162,
        31,
        198,
        192,
        109,
        36,
        169
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "launch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  97,
                  117,
                  110,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "launchAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "launch"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "quoteMint",
          "address": "So11111111111111111111111111111111111111112"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "initLaunchParams"
            }
          }
        }
      ]
    },
    {
      "name": "initPumpLaunch",
      "discriminator": [
        31,
        24,
        172,
        177,
        57,
        53,
        211,
        163
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "pumpMint"
        },
        {
          "name": "pumpLaunch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  117,
                  109,
                  112,
                  95,
                  108,
                  97,
                  117,
                  110,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "pumpMint"
              }
            ]
          }
        },
        {
          "name": "launchAuthority",
          "docs": [
            "and as the bridge-escrow signer."
          ],
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  117,
                  109,
                  112,
                  95,
                  97,
                  117,
                  116,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "pumpLaunch"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "initPumpLaunchParams"
            }
          }
        }
      ]
    },
    {
      "name": "releaseToBridge",
      "discriminator": [
        155,
        192,
        176,
        70,
        118,
        47,
        146,
        108
      ],
      "accounts": [
        {
          "name": "cranker",
          "writable": true,
          "signer": true,
          "address": "5BYyHQHe8CMcAMJogQpz2c9wukSSAZdhrsdnvSFwTVVx"
        },
        {
          "name": "launch",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  97,
                  117,
                  110,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "launchAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "launch"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "launch"
          ]
        },
        {
          "name": "quoteMint",
          "address": "So11111111111111111111111111111111111111112",
          "relations": [
            "launch"
          ]
        },
        {
          "name": "launchQuoteAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "launchAuthority"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "quoteMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "crankerQuoteAta",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "releaseToBridgeParams"
            }
          }
        }
      ]
    },
    {
      "name": "releaseToBridgePump",
      "discriminator": [
        47,
        215,
        91,
        95,
        235,
        112,
        158,
        65
      ],
      "accounts": [
        {
          "name": "cranker",
          "writable": true,
          "signer": true,
          "address": "5BYyHQHe8CMcAMJogQpz2c9wukSSAZdhrsdnvSFwTVVx"
        },
        {
          "name": "pumpLaunch",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  117,
                  109,
                  112,
                  95,
                  108,
                  97,
                  117,
                  110,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "pump_launch.pump_mint",
                "account": "pumpLaunch"
              }
            ]
          }
        },
        {
          "name": "launchAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  117,
                  109,
                  112,
                  95,
                  97,
                  117,
                  116,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "pumpLaunch"
              }
            ]
          }
        },
        {
          "name": "wsolMint",
          "address": "So11111111111111111111111111111111111111112"
        },
        {
          "name": "launchWsolAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "launchAuthority"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "wsolMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "crankerWsolAta",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "releaseToBridgeParams"
            }
          }
        }
      ]
    },
    {
      "name": "sell",
      "discriminator": [
        51,
        230,
        133,
        164,
        1,
        127,
        131,
        173
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "launch",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  97,
                  117,
                  110,
                  99,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "launchAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  117,
                  116,
                  104
                ]
              },
              {
                "kind": "account",
                "path": "launch"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true,
          "relations": [
            "launch"
          ]
        },
        {
          "name": "quoteMint",
          "address": "So11111111111111111111111111111111111111112",
          "relations": [
            "launch"
          ]
        },
        {
          "name": "userSynthAta",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "userQuoteAta",
          "docs": [
            "User's wSOL ATA. Curve payout lands here."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "quoteMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "launchQuoteAta",
          "docs": [
            "Launch's wSOL escrow ATA. Curve pulls from here."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "launchAuthority"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "quoteMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "crankerWsolAta",
          "docs": [
            "Cranker wSOL ATA — receives fee_bps × sol_out on every sell."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "cranker"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "quoteMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "cranker",
          "address": "5BYyHQHe8CMcAMJogQpz2c9wukSSAZdhrsdnvSFwTVVx"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "sellParams"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "launch",
      "discriminator": [
        144,
        51,
        51,
        163,
        206,
        85,
        213,
        38
      ]
    },
    {
      "name": "pumpLaunch",
      "discriminator": [
        142,
        51,
        20,
        70,
        67,
        122,
        52,
        220
      ]
    }
  ],
  "events": [
    {
      "name": "buyIntent",
      "discriminator": [
        251,
        72,
        172,
        161,
        181,
        188,
        244,
        238
      ]
    },
    {
      "name": "harvestIntent",
      "discriminator": [
        23,
        43,
        248,
        24,
        117,
        55,
        158,
        216
      ]
    },
    {
      "name": "launchInitialized",
      "discriminator": [
        60,
        143,
        196,
        55,
        214,
        166,
        10,
        63
      ]
    },
    {
      "name": "pumpLaunchInitialized",
      "discriminator": [
        115,
        236,
        30,
        91,
        232,
        8,
        235,
        234
      ]
    },
    {
      "name": "sellIntent",
      "discriminator": [
        166,
        17,
        49,
        0,
        203,
        93,
        100,
        72
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "alreadyGraduated",
      "msg": "launch is already graduated"
    },
    {
      "code": 6001,
      "name": "notGraduated",
      "msg": "launch has not yet graduated"
    },
    {
      "code": 6002,
      "name": "belowGraduationThreshold",
      "msg": "graduation threshold not yet reached"
    },
    {
      "code": 6003,
      "name": "slippageExceeded",
      "msg": "slippage exceeded"
    },
    {
      "code": 6004,
      "name": "zeroAmount",
      "msg": "amount must be non-zero"
    },
    {
      "code": 6005,
      "name": "mathOverflow",
      "msg": "math overflow"
    },
    {
      "code": 6006,
      "name": "staleOracle",
      "msg": "oracle price unavailable or stale"
    },
    {
      "code": 6007,
      "name": "bridgeNotAuthorized",
      "msg": "bridge action not authorized"
    },
    {
      "code": 6008,
      "name": "invalidQuoteMint",
      "msg": "invalid quote mint"
    },
    {
      "code": 6009,
      "name": "leverageOutOfRange",
      "msg": "leverage exceeds protocol cap (3x)"
    },
    {
      "code": 6010,
      "name": "curveExhausted",
      "msg": "curve has run out of tokens; wait for graduation"
    },
    {
      "code": 6011,
      "name": "insufficientShares",
      "msg": "not enough tokens in user account"
    }
  ],
  "types": [
    {
      "name": "backingDirection",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "long"
          },
          {
            "name": "short"
          }
        ]
      }
    },
    {
      "name": "buyIntent",
      "docs": [
        "Emitted on `buy`. The frontend / harvest bot watches these to construct the deBridge",
        "DlnSource order in the same Solana transaction so funds bridge to HyperEVM atomically."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "solIn",
            "type": "u64"
          },
          {
            "name": "sharesMinted",
            "type": "u64"
          },
          {
            "name": "perpAsset",
            "type": "u16"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "backingDirection"
              }
            }
          },
          {
            "name": "leverageBps",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "buyParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "solIn",
            "type": "u64"
          },
          {
            "name": "minTokensOut",
            "docs": [
              "Minimum tokens the buyer accepts. If the curve releases fewer (slippage), revert."
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "harvestIntent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pumpLaunch",
            "type": "pubkey"
          },
          {
            "name": "pumpMint",
            "type": "pubkey"
          },
          {
            "name": "lamportsIn",
            "type": "u64"
          },
          {
            "name": "baseAmount",
            "type": "u64"
          },
          {
            "name": "perpAsset",
            "type": "u16"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "backingDirection"
              }
            }
          }
        ]
      }
    },
    {
      "name": "harvestParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lamportsToDeploy",
            "type": "u64"
          },
          {
            "name": "baseAmount",
            "type": "u64"
          },
          {
            "name": "minBaseAmount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "initLaunchParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "hyperliquidPerpAsset",
            "type": "u16"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "graduationThresholdLamports",
            "type": "u64"
          },
          {
            "name": "leverageBps",
            "type": "u16"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "backingDirection"
              }
            }
          }
        ]
      }
    },
    {
      "name": "initPumpLaunchParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "referencePerpMarketIndex",
            "type": "u16"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "backingDirection"
              }
            }
          }
        ]
      }
    },
    {
      "name": "launch",
      "docs": [
        "Launch backs an SPL mint with a cross-chain leveraged perp position on Hyperliquid",
        "plus a constant-product bonding curve on Solana.",
        "",
        "Price discovery happens on the curve (virtual reserves model, pump.fun-style):",
        "each buy releases tokens to the buyer along the curve AND ships SOL to the bridge",
        "crank which opens a leveraged perp position of `sol_in * leverage` notional on",
        "Hyperliquid. Sells reverse: burn tokens from the curve, refund proportional SOL,",
        "and signal a reduce-only close on the perp side.",
        "",
        "Note: this layout is NOT backwards-compatible with pre-curve Launch accounts.",
        "Old launches (test data) become unreadable after the curve upgrade."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authorityBump",
            "type": "u8"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "quoteMint",
            "type": "pubkey"
          },
          {
            "name": "hyperliquidPerpAsset",
            "type": "u16"
          },
          {
            "name": "reservedSpotIndex",
            "type": "u16"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "leverageBps",
            "type": "u16"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "backingDirection"
              }
            }
          },
          {
            "name": "totalMinted",
            "type": "u64"
          },
          {
            "name": "totalBurned",
            "type": "u64"
          },
          {
            "name": "cumulativeQuoteIn",
            "type": "u64"
          },
          {
            "name": "cumulativeQuoteOut",
            "type": "u64"
          },
          {
            "name": "graduationThresholdLamports",
            "type": "u64"
          },
          {
            "name": "isGraduated",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "virtualSolReserves",
            "docs": [
              "Bonding curve state (constant product, virtual reserves)."
            ],
            "type": "u64"
          },
          {
            "name": "virtualTokenReserves",
            "type": "u64"
          },
          {
            "name": "realSolReserves",
            "type": "u64"
          },
          {
            "name": "realTokenReserves",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "launchInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "perpAsset",
            "type": "u16"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "backingDirection"
              }
            }
          },
          {
            "name": "leverageBps",
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "pumpLaunch",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "authorityBump",
            "type": "u8"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "pumpMint",
            "type": "pubkey"
          },
          {
            "name": "referencePerpMarketIndex",
            "type": "u16"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "backingDirection"
              }
            }
          },
          {
            "name": "cumulativeLamportsHarvested",
            "type": "u64"
          },
          {
            "name": "cumulativeBaseOpened",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "pumpLaunchInitialized",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pumpLaunch",
            "type": "pubkey"
          },
          {
            "name": "pumpMint",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "perpAsset",
            "type": "u16"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "backingDirection"
              }
            }
          }
        ]
      }
    },
    {
      "name": "releaseToBridgeParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "sellIntent",
      "docs": [
        "Emitted on `sell`. Triggers reverse-direction bridge order to close the per-launch",
        "position on Hyperliquid and return USDC to the user on Solana."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "launch",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "sharesBurned",
            "type": "u64"
          },
          {
            "name": "minSolOut",
            "type": "u64"
          },
          {
            "name": "perpAsset",
            "type": "u16"
          },
          {
            "name": "direction",
            "type": {
              "defined": {
                "name": "backingDirection"
              }
            }
          }
        ]
      }
    },
    {
      "name": "sellParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "sharesIn",
            "type": "u64"
          },
          {
            "name": "minSolOut",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "bridgeCranker",
      "docs": [
        "Authorised bridge crank. Pulls wSOL/SOL out of launch_authority PDAs and ships orders",
        "to deBridge DlnSource on Solana. Single trusted hot wallet, owned by the project.",
        "Set to the mainnet deployer for now (same wallet that pays for the program upgrade);",
        "can be rotated by redeploying with a new constant if it gets compromised."
      ],
      "type": "pubkey",
      "value": "5BYyHQHe8CMcAMJogQpz2c9wukSSAZdhrsdnvSFwTVVx"
    },
    {
      "name": "dlnSourceProgramId",
      "docs": [
        "deBridge DLN source program on Solana."
      ],
      "type": "pubkey",
      "value": "src5qyZHqTqecJV4aY6Cb6zDZLMDzrDKKezs22MPHr4"
    },
    {
      "name": "launchAuthSeed",
      "type": "bytes",
      "value": "[97, 117, 116, 104]"
    },
    {
      "name": "launchSeed",
      "type": "bytes",
      "value": "[108, 97, 117, 110, 99, 104]"
    },
    {
      "name": "usdcMint",
      "docs": [
        "USDC on Solana mainnet. Used as bridge medium since deBridge solvers want USDC."
      ],
      "type": "pubkey",
      "value": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    },
    {
      "name": "wsolMint",
      "type": "pubkey",
      "value": "So11111111111111111111111111111111111111112"
    }
  ]
};
