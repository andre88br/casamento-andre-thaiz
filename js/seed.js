// Conteúdo inicial das abas (sem os nomes dos convidados, que são privados).
window.SEED = {
 "abas": [
  {
   "nome": "Total",
   "icone": "💰",
   "secoes": [
    {
     "titulo": "Resumo por menu",
     "tipo": "resumo",
     "colunas": [],
     "linhas": []
    },
    {
     "titulo": "Outros custos",
     "tipo": "cards",
     "soma": true,
     "colunas": [
      {
       "nome": "Descrição",
       "tipo": "texto"
      },
      {
       "nome": "Valor",
       "tipo": "numero"
      }
     ],
     "linhas": []
    }
   ]
  },
  {
   "nome": "Igreja",
   "icone": "⛪",
   "secoes": [
    {
     "titulo": "Igreja",
     "tipo": "cards",
     "colunas": [
      {
       "nome": "Local",
       "tipo": "texto"
      },
      {
       "nome": "Igreja",
       "tipo": "texto"
      },
      {
       "nome": "Valor",
       "tipo": "numero"
      },
      {
       "nome": "Obs. do valor",
       "tipo": "texto"
      },
      {
       "nome": "Forma de pagamento",
       "tipo": "longo"
      },
      {
       "nome": "Escolhido",
       "tipo": "escolha"
      }
     ],
     "linhas": [
      [
       "Uberlândia",
       "São Cristóvão",
       1600,
       "1 salário mínimo",
       "Metada na entrada + metade até 30 dias antes - se for em 2026",
       false
      ],
      [
       "Ps. Olegário",
       "Santa Rita",
       "",
       "",
       "",
       false
      ]
     ],
     "escolha": true
    },
    {
     "titulo": "Extras",
     "tipo": "cards",
     "colunas": [
      {
       "nome": "Item",
       "tipo": "texto"
      },
      {
       "nome": "Valor",
       "tipo": "numero"
      },
      {
       "nome": "Obs. do valor",
       "tipo": "texto"
      },
      {
       "nome": "Incluir no total",
       "tipo": "check"
      }
     ],
     "linhas": [
      [
       "Taxa de transferência dos documentos",
       "",
       "R$50 a R$200",
       false
      ],
      [
       "Curso de Noivos",
       "",
       "?",
       false
      ],
      [
       "Decoração",
       "",
       "",
       false
      ],
      [
       "Fotografia",
       "",
       "",
       false
      ],
      [
       "Coral",
       "",
       "",
       false
      ]
     ],
     "incluir": true
    }
   ]
  },
  {
   "nome": "Cartório",
   "icone": "📜",
   "secoes": [
    {
     "titulo": "Informações",
     "tipo": "cards",
     "colunas": [
      {
       "nome": "Assunto",
       "tipo": "texto"
      },
      {
       "nome": "Detalhe",
       "tipo": "longo"
      }
     ],
     "linhas": [
      [
       "Documentos",
       "https://www.registrociviludi.com.br/page/registro-civil-das-pessoas-naturais-casamento"
      ],
      [
       "Observação",
       "A Marcação do Casamento deverá ser feita no mínimo 6 (seis) dias e no máximo 90 (noventa) dias de antecedência da data do casamento, conforme disponibilidade da agenda."
      ],
      [
       "Observação",
       "Em regra os casamentos no Cartório de Uberlândia/MG são realizados de quarta à sexta, das 09:10h às 10:40h e das 13:10h às 16:10h e aos sábados, das 08:10h às 11:10h.\nOs casamentos ocorrem individualmente, com horário marcado, em intervalos de 20 minutos."
      ],
      [
       "Observação",
       "Decidir o regime de bens: Comunhão Parcial de Bens / Comunhão Universal de Bens (Necessário pacto antenupcial) / Separação de Bens (Necessário pacto antenupcial)"
      ],
      [
       "Valor dentro do Cartório",
       "R$ 617,08 + R$ 13,91  por folhas arquivadas"
      ]
     ]
    },
    {
     "titulo": "Valores",
     "tipo": "cards",
     "soma": true,
     "colunas": [
      {
       "nome": "Descrição",
       "tipo": "texto"
      },
      {
       "nome": "Valor",
       "tipo": "numero"
      }
     ],
     "linhas": [
      [
       "Taxas do cartório",
       690
      ]
     ]
    }
   ]
  },
  {
   "nome": "Espaço",
   "icone": "🏡",
   "secoes": [
    {
     "titulo": "Espaços",
     "tipo": "cards",
     "colunas": [
      {
       "nome": "Espaço",
       "tipo": "texto"
      },
      {
       "nome": "Instagram",
       "tipo": "link"
      },
      {
       "nome": "Retornou?",
       "tipo": "check"
      },
      {
       "nome": "Valor",
       "tipo": "numero"
      },
      {
       "nome": "Valor Out/26",
       "tipo": "texto"
      },
      {
       "nome": "Forma de pagamento",
       "tipo": "longo"
      },
      {
       "nome": "Tem sua data disponível?",
       "tipo": "texto"
      },
      {
       "nome": "Datas disponíveis",
       "tipo": "texto"
      },
      {
       "nome": "Escolhido",
       "tipo": "escolha"
      }
     ],
     "linhas": [
      [
       "Chacária Gold Village",
       "https://www.instagram.com/chacaragoldvillage/",
       true,
       4170,
       "",
       "Pagamento 20% no ato do contrato e o restante até 1 semana antes da data locada",
       "",
       "",
       false
      ],
      [
       "Villa Sonhos",
       "https://www.instagram.com/villa.sonhos/",
       false,
       "",
       "",
       "",
       "",
       "",
       false
      ],
      [
       "Chacára Berro D'água",
       "https://www.instagram.com/chacaraberrodagua/",
       false,
       "",
       "",
       "",
       "",
       "",
       false
      ],
      [
       "Villa Terrê",
       "https://www.instagram.com/villaterreeventos/",
       true,
       6500,
       "",
       "*Até 70 convidados",
       "",
       "",
       false
      ],
      [
       "Santa Felicitá",
       "https://www.instagram.com/espacosantafelicita/",
       true,
       "",
       "",
       "",
       "",
       "",
       false
      ],
      [
       "Spaço Verde",
       "https://www.instagram.com/chacaraspacoverde/",
       true,
       28000,
       "",
       "chácara+ buffet+ decoração ( 11 e 12 - se for só dormir não cobra nada, se for o dia todo mais 1k)",
       "",
       "",
       false
      ],
      [
       "Spaço Atrium Eventos",
       "https://www.instagram.com/espaco_atrium_eventos/?g=5",
       false,
       "",
       "",
       "",
       "",
       "",
       false
      ],
      [
       "Chácara Flamboyant",
       "https://www.instagram.com/chacaraflamboyantudi/",
       true,
       10000,
       "",
       "Parcela em 10x - desconto de 5% em pagamento a vista",
       "Não",
       "",
       false
      ],
      [
       "Chácara Panorama Lounge",
       "https://www.instagram.com/chacarapanoramalounge/?g=5",
       true,
       10000,
       "",
       "uma entrada de 3000,00 e 6x de 1166,66 e a vista 8500,00 - Ambas incluímos gerador e estacionamento",
       "",
       "",
       false
      ],
      [
       "Varanda das Colinas",
       "https://www.instagram.com/varandasdacolina/tagged/",
       false,
       "",
       "",
       "",
       "",
       "",
       false
      ],
      [
       "Casa do Bosque",
       "https://www.instagram.com/casadobosqueudi/",
       false,
       "",
       "",
       "",
       "",
       "",
       false
      ],
      [
       "Chácara Green Hall",
       "https://www.instagram.com/chacaragreenhall/",
       true,
       "",
       "",
       "Só enviam valores mediante a visita presencial",
       "",
       "",
       false
      ],
      [
       "Chácara Parnassus Eventos",
       "https://www.instagram.com/parnassuseventos/",
       false,
       "",
       "",
       "",
       "",
       "",
       false
      ],
      [
       "Panorama New Lounge",
       "HTTPS://instagram.com/newloungeeventos",
       true,
       11000,
       "",
       "entrada de  3300,00 e 6x 1283,33  ou  a vista 9350,00 - Ambas incluímos gerador e estacionamento",
       "",
       "",
       false
      ],
      [
       "Chácara 7",
       "https://www.instagram.com/chacara7_/?g=5",
       true,
       3000,
       "",
       "Se for Domingo ou segunda - Não tem disponibilidade na data, só 1 fds antes ou dps.",
       "",
       "",
       false
      ],
      [
       "Quintal da Morada",
       "https://www.instagram.com/quintaldamorada/",
       true,
       6000,
       "",
       "Contrato com entrada de 30% do total + o valor residual 1 semana antes do evento - não divide nem parcela",
       "",
       "",
       false
      ],
      [
       "Recanto da Lua",
       "https://www.instagram.com/recantodaluauberlandia?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
       false,
       "",
       "",
       "",
       "",
       "",
       false
      ],
      [
       "Acrópole",
       "",
       false,
       "",
       "",
       "",
       "",
       "",
       false
      ],
      [
       "Alameda 855",
       "https://www.instagram.com/myrnadecor/",
       true,
       29686.46,
       "",
       "Espaço condicionado ao buffet e decoração - até 100 convidados",
       "",
       "",
       false
      ],
      [
       "Toque de arte",
       "https://www.instagram.com/chacaratoquedearte/",
       false,
       "",
       "",
       "",
       "",
       "",
       false
      ],
      [
       "Chacára Vovó Lourdes",
       "https://www.instagram.com/chacaravolourdes/",
       false,
       "",
       "",
       "",
       "",
       "",
       false
      ],
      [
       "Chácara babilonia",
       "https://www.instagram.com/chacara_babilonia/",
       false,
       "",
       "",
       "",
       "",
       "",
       false
      ]
     ],
     "escolha": true
    }
   ]
  },
  {
   "nome": "Assessorias",
   "icone": "🗂️",
   "secoes": [
    {
     "titulo": "Assessorias",
     "tipo": "cards",
     "colunas": [
      {
       "nome": "Nome",
       "tipo": "texto"
      },
      {
       "nome": "Instagram",
       "tipo": "link"
      },
      {
       "nome": "Valor",
       "tipo": "numero"
      },
      {
       "nome": "Diferenciais",
       "tipo": "longo"
      },
      {
       "nome": "Escolhido",
       "tipo": "escolha"
      }
     ],
     "linhas": [
      [
       "Aline Vilela",
       "https://www.instagram.com/aline_vilelacerimonialista/",
       "",
       "",
       false
      ],
      [
       "Tatiane Martins",
       "https://www.instagram.com/tatianamartinscerimonial/?hl=pt-br",
       "",
       "",
       false
      ],
      [
       "Deise Cerimonial",
       "https://www.instagram.com/deisecerimonial/",
       "",
       "",
       false
      ],
      [
       "Cerimonial Lima Por Cristiellem Lima",
       "https://www.instagram.com/cerimoniallima/?g=5",
       "",
       "",
       false
      ]
     ],
     "escolha": true
    }
   ]
  },
  {
   "nome": "Buffets",
   "icone": "🍽️",
   "secoes": [
    {
     "titulo": "Buffets",
     "tipo": "cards",
     "colunas": [
      {
       "nome": "Nome",
       "tipo": "texto"
      },
      {
       "nome": "Instagram",
       "tipo": "link"
      },
      {
       "nome": "Valor",
       "tipo": "numero"
      },
      {
       "nome": "Valor por pessoa",
       "tipo": "numero"
      },
      {
       "nome": "Diferenciais",
       "tipo": "longo"
      },
      {
       "nome": "Escolhido",
       "tipo": "escolha"
      }
     ],
     "linhas": [
      [
       "STILLUS | Buffet e Decoração",
       "https://www.instagram.com/stillusbuffetedecoracao/",
       "",
       "",
       "",
       false
      ],
      [
       "BUFFET MARLY FESTAS",
       "https://www.instagram.com/marlyfestasbuffet/",
       "",
       "",
       "",
       false
      ],
      [
       "Buffet Emiliana Moraes",
       "https://www.instagram.com/buffetemilianamoraes/",
       "",
       "",
       "",
       false
      ],
      [
       "Bárbaros Buffet",
       "https://www.instagram.com/barbarosbuffet/",
       "",
       "",
       "",
       false
      ]
     ],
     "porPessoa": true,
     "escolha": true
    }
   ]
  },
  {
   "nome": "Fornecedores",
   "icone": "🤝",
   "secoes": [
    {
     "titulo": "Fornecedores",
     "tipo": "cards",
     "colunas": [
      {
       "nome": "Fornecedor",
       "tipo": "texto"
      },
      {
       "nome": "Categoria",
       "tipo": "texto"
      },
      {
       "nome": "Instagram",
       "tipo": "link"
      },
      {
       "nome": "Valor",
       "tipo": "numero"
      },
      {
       "nome": "Valor por pessoa",
       "tipo": "numero"
      },
      {
       "nome": "Só quem bebe?",
       "tipo": "check"
      },
      {
       "nome": "Escolhido",
       "tipo": "escolha"
      }
     ],
     "linhas": [
      [
       "Sr. Custela",
       "",
       "",
       "",
       "",
       false,
       false
      ],
      [
       "Choperia Eventos",
       "",
       "https://www.instagram.com/chopperia_eventos/",
       "",
       "",
       true,
       false
      ]
     ],
     "porPessoa": true,
     "escolha": true,
     "escolhaPor": "Categoria"
    }
   ]
  },
  {
   "nome": "Noiva",
   "icone": "👰",
   "secoes": [
    {
     "titulo": "Valores",
     "tipo": "cards",
     "soma": true,
     "colunas": [
      {
       "nome": "Descrição",
       "tipo": "texto"
      },
      {
       "nome": "Valor",
       "tipo": "numero"
      }
     ],
     "linhas": []
    }
   ]
  },
  {
   "nome": "Noivo",
   "icone": "🤵",
   "secoes": [
    {
     "titulo": "Valores",
     "tipo": "cards",
     "soma": true,
     "colunas": [
      {
       "nome": "Descrição",
       "tipo": "texto"
      },
      {
       "nome": "Valor",
       "tipo": "numero"
      }
     ],
     "linhas": []
    }
   ]
  },
  {
   "nome": "Lista de convidados",
   "icone": "👥",
   "secoes": [
    {
     "titulo": "Convidados",
     "tipo": "tabela",
     "guests": true,
     "colunas": [
      {
       "nome": "Convidado",
       "tipo": "texto"
      },
      {
       "nome": "Telefone",
       "tipo": "telefone"
      },
      {
       "nome": "E-mail",
       "tipo": "email"
      },
      {
       "nome": "Tipo",
       "tipo": "opcoes",
       "opcoes": [
        "Adulto",
        "Criança"
       ]
      },
      {
       "nome": "Categoria",
       "tipo": "opcoes",
       "opcoes": [
        "Família",
        "Amigo",
        "Conhecido"
       ]
      },
      {
       "nome": "De quem",
       "tipo": "opcoes",
       "opcoes": [
        "NOIVA",
        "NOIVO"
       ]
      },
      {
       "nome": "Confirmação",
       "tipo": "opcoes",
       "opcoes": [
        "Pendente",
        "Confirmado",
        "Recusou"
       ]
      },
      {
       "nome": "Chance de comparecimento",
       "tipo": "percentual"
      },
      {
       "nome": "Bebe?",
       "tipo": "opcoes",
       "opcoes": [
        "Sim",
        "Não"
       ]
      }
     ],
     "linhas": []
    }
   ]
  }
 ]
};
