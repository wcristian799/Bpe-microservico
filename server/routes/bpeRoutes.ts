import { Router, Request, Response } from 'express';
import { bpeService } from '../services/bpeService';
import { cleanDocumento } from '../utils/ibge';

export const bpeRouter = Router();

/**
 * @route POST /api/bpe/emitir
 * @description Endpoint principal do microserviço para receber dados de outro sistema e emitir o BP-e
 */
bpeRouter.post('/bpe/emitir', async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== 'object') {
      res.status(400).json({
        sucesso: false,
        erro: 'Payload JSON inválido para emissão de BP-e.',
      });
      return;
    }

    const resultado = await bpeService.emitirBPe(payload);

    res.status(resultado.sucesso ? 200 : 422).json({
      sucesso: resultado.sucesso,
      mensagem: resultado.sucesso ? 'BP-e emitido e autorizado com sucesso!' : 'BP-e rejeitado pela SEFAZ.',
      dados: resultado,
    });
  } catch (error: any) {
    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro interno ao processar emissão de BP-e.',
    });
  }
});

/**
 * @route POST /api/bpe/cancelar
 * @description Cancela um BP-e autorizado na SEFAZ (tpEvento 110111)
 */
bpeRouter.post('/bpe/cancelar', async (req: Request, res: Response): Promise<void> => {
  try {
    const { chave, justificativa } = req.body;

    if (!chave) {
      res.status(400).json({ sucesso: false, erro: 'Chave de acesso do BP-e é obrigatória.' });
      return;
    }

    if (!justificativa || justificativa.trim().length < 15) {
      res.status(400).json({
        sucesso: false,
        erro: 'A justificativa deve conter no mínimo 15 caracteres (Exigência SEFAZ).',
      });
      return;
    }

    const resultado = await bpeService.cancelarBPe(chave, justificativa);

    res.status(resultado.sucesso ? 200 : 422).json({
      sucesso: resultado.sucesso,
      mensagem: resultado.sucesso ? 'BP-e cancelado com sucesso!' : 'Falha no cancelamento do BP-e na SEFAZ.',
      dados: resultado,
    });
  } catch (error: any) {
    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro ao cancelar BP-e.',
    });
  }
});

/**
 * @route POST /api/bpe/nao-embarque
 * @description Registra o evento de Não Embarque do Passageiro (tpEvento 110115)
 */
bpeRouter.post('/bpe/nao-embarque', async (req: Request, res: Response): Promise<void> => {
  try {
    const { chave, justificativa } = req.body;

    if (!chave) {
      res.status(400).json({ sucesso: false, erro: 'Chave de acesso do BP-e é obrigatória.' });
      return;
    }

    if (!justificativa || justificativa.trim().length < 15) {
      res.status(400).json({
        sucesso: false,
        erro: 'A justificativa deve conter no mínimo 15 caracteres (Exigência SEFAZ).',
      });
      return;
    }

    const resultado = await bpeService.registrarNaoEmbarque(chave, justificativa);

    res.status(resultado.sucesso ? 200 : 422).json({
      sucesso: resultado.sucesso,
      mensagem: resultado.sucesso ? 'Evento de Não Embarque registrado com sucesso!' : 'Falha ao registrar evento na SEFAZ.',
      dados: resultado,
    });
  } catch (error: any) {
    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro ao registrar Não Embarque.',
    });
  }
});

/**
 * @route GET /api/bpe/consultar/:chave
 * @description Consulta a situação de um BP-e na SEFAZ e no histórico
 */
bpeRouter.get('/bpe/consultar/:chave', async (req: Request, res: Response): Promise<void> => {
  try {
    const { chave } = req.params;
    const resultado = await bpeService.consultarBPe(chave);

    res.json({
      sucesso: true,
      dados: resultado,
    });
  } catch (error: any) {
    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro ao consultar BP-e.',
    });
  }
});

/**
 * @route GET /api/bpe/status-servico
 * @description Consulta a disponibilidade do Web Service da SEFAZ
 */
bpeRouter.get('/bpe/status-servico', async (req: Request, res: Response): Promise<void> => {
  try {
    const uf = req.query.uf as string;
    const resultado = await bpeService.consultarStatusServico(uf);

    res.json({
      sucesso: resultado.sucesso,
      dados: resultado,
    });
  } catch (error: any) {
    res.status(500).json({
      sucesso: false,
      erro: error.message || 'Erro ao verificar status do serviço da SEFAZ.',
    });
  }
});

/**
 * @route GET /api/bpe/historico
 * @description Retorna a listagem de BP-e emitidos pelo microserviço
 */
bpeRouter.get('/bpe/historico', (req: Request, res: Response): void => {
  try {
    const historico = bpeService.getHistorico();
    res.json({
      sucesso: true,
      total: historico.length,
      dados: historico,
    });
  } catch (error: any) {
    res.status(500).json({
      sucesso: false,
      erro: error.message,
    });
  }
});

/**
 * @route GET /api/bpe/xml/:chave
 * @description Faz o download do XML do BP-e (procBPe ou assinado)
 */
bpeRouter.get('/bpe/xml/:chave', (req: Request, res: Response): void => {
  try {
    const { chave } = req.params;
    const registro = bpeService.getBPePorChave(chave);

    if (!registro) {
      res.status(404).send('BP-e não encontrado.');
      return;
    }

    const xml = registro.xmlProc || registro.xmlAssinado;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${chave}-procBPe.xml"`);
    res.send(xml);
  } catch (error: any) {
    res.status(500).send(`Erro ao obter XML: ${error.message}`);
  }
});

/**
 * @route GET /api/bpe/dados/:chave
 * @description Retorna os dados completos do registro para renderização do DABPE
 */
bpeRouter.get('/bpe/dados/:chave', (req: Request, res: Response): void => {
  try {
    const { chave } = req.params;
    const registro = bpeService.getBPePorChave(chave);

    if (!registro) {
      res.status(404).json({ sucesso: false, erro: 'BP-e não encontrado.' });
      return;
    }

    res.json({
      sucesso: true,
      dados: registro,
    });
  } catch (error: any) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

/**
 * @route GET /api/config
 * @description Retorna a configuração atual do microserviço e certificado
 */
bpeRouter.get('/config', (req: Request, res: Response): void => {
  try {
    const config = bpeService.getConfig();
    const certificado = bpeService.getCertificadoInfo();

    res.json({
      sucesso: true,
      config,
      certificado,
    });
  } catch (error: any) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

/**
 * @route POST /api/config
 * @description Atualiza configurações do microserviço
 */
bpeRouter.post('/config', (req: Request, res: Response): void => {
  try {
    const newConfig = req.body;
    const updated = bpeService.updateConfig(newConfig);
    const certificado = bpeService.getCertificadoInfo();

    res.json({
      sucesso: true,
      mensagem: 'Configurações atualizadas com sucesso!',
      config: updated,
      certificado,
    });
  } catch (error: any) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

/**
 * @route POST /api/config/certificado
 * @description Faz o upload e ativação do certificado A1 (.pfx / .p12 em base64)
 */
bpeRouter.post('/config/certificado', (req: Request, res: Response): void => {
  try {
    const { pfxBase64, senha } = req.body;

    if (!pfxBase64) {
      res.status(400).json({ sucesso: false, erro: 'Arquivo do certificado (.pfx em base64) é obrigatório.' });
      return;
    }

    const buffer = Buffer.from(pfxBase64, 'base64');
    const certInfo = bpeService.carregarCertificadoPfx(buffer, senha || '');

    res.json({
      sucesso: true,
      mensagem: 'Certificado Digital A1 carregado e validado com sucesso!',
      certificado: certInfo,
    });
  } catch (error: any) {
    res.status(400).json({
      sucesso: false,
      erro: error.message || 'Falha ao processar certificado digital.',
    });
  }
});

/**
 * @route POST /api/config/certificado-demo
 * @description Gera certificado auto-assinado para testes
 */
bpeRouter.post('/config/certificado-demo', (req: Request, res: Response): void => {
  try {
    const certInfo = bpeService.gerarCertificadoDemonstracao();
    res.json({
      sucesso: true,
      mensagem: 'Certificado de teste gerado com sucesso para ambiente Sandbox!',
      certificado: certInfo,
    });
  } catch (error: any) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

/**
 * @route POST /api/config/certificado-limpar
 * @description Remove o certificado digital ativo em memória
 */
bpeRouter.post('/config/certificado-limpar', (req: Request, res: Response): void => {
  try {
    const certInfo = bpeService.limparCertificado();
    res.json({
      sucesso: true,
      mensagem: 'Certificado removido da memória do microserviço.',
      certificado: certInfo,
    });
  } catch (error: any) {
    res.status(500).json({ sucesso: false, erro: error.message });
  }
});

/**
 * @route GET /api/docs/openapi
 * @description Retorna a especificação OpenAPI 3.0 para fácil importação no Postman, Insomnia ou Swagger
 */
bpeRouter.get('/docs/openapi', (req: Request, res: Response): void => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';

  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Microserviço de BP-e (Bilhete de Passagem Eletrônico - Modelo 63) - SEFAZ-PA / Belém',
      version: '1.0.0',
      description:
        'API RESTful para emissão, assinatura digital A1, transmissão para SEFAZ-PA (SVRS) e geração de DABPE para empresas de transporte rodoviário em Belém-PA.',
    },
    servers: [
      {
        url: `${protocol}://${host}/api`,
        description: 'Servidor do Microserviço BP-e',
      },
    ],
    paths: {
      '/bpe/emitir': {
        post: {
          summary: 'Emite e autoriza um BP-e na SEFAZ (Pará / SVRS)',
          description:
            'Recebe os dados da passagem em formato JSON simplificado, monta o XML fiscal (MOC v1.00), assina com o Certificado Digital A1, transmite para a SEFAZ, gera o procBPe e retorna a Chave de Acesso, Protocolo e URLs do QR Code e DABPE.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cUF: { type: 'string', example: '15' },
                    ufIni: { type: 'string', example: 'PA' },
                    cMunIni: { type: 'string', example: '1501402' },
                    xMunIni: { type: 'string', example: 'Belem' },
                    ufFim: { type: 'string', example: 'PA' },
                    cMunFim: { type: 'string', example: '1504208' },
                    xMunFim: { type: 'string', example: 'Maraba' },
                    tpTrecho: { type: 'integer', enum: [0, 1, 2, 3], example: 1 },
                    dhViagem: { type: 'string', example: '2026-09-01T14:30:00-03:00' },
                    tpViagem: { type: 'integer', enum: [0, 1, 2, 3], example: 0 },
                    xLinha: { type: 'string', example: 'BELEM X MARABA (FOLHA 32)' },
                    poltrona: { type: 'string', example: '14' },
                    comprador: {
                      type: 'object',
                      properties: {
                        xNome: { type: 'string', example: 'RAIMUNDO NONATO PINHEIRO' },
                        cpfOuCnpj: { type: 'string', example: '84920147234' },
                      },
                    },
                    valores: {
                      type: 'object',
                      properties: {
                        vTarifa: { type: 'number', example: 145.0 },
                        vTaxaEmbarque: { type: 'number', example: 9.5 },
                        vPedagio: { type: 'number', example: 0.0 },
                        vSeguro: { type: 'number', example: 4.5 },
                      },
                    },
                    pagamentos: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          tPag: { type: 'string', example: '17' },
                          vPag: { type: 'number', example: 159.0 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'BP-e autorizado na SEFAZ com sucesso.' },
            '422': { description: 'Rejeição SEFAZ ou inconsistência fiscal.' },
          },
        },
      },
      '/bpe/cancelar': {
        post: {
          summary: 'Cancela um BP-e autorizado',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['chave', 'justificativa'],
                  properties: {
                    chave: { type: 'string', example: '15260804891234000185630010000000011123456789' },
                    justificativa: { type: 'string', example: 'Cancelamento solicitado pelo passageiro antes do embarque' },
                  },
                },
              },
            },
          },
        },
      },
      '/bpe/status-servico': {
        get: {
          summary: 'Verifica o status dos WebServices da SEFAZ',
          parameters: [
            {
              name: 'uf',
              in: 'query',
              required: false,
              schema: { type: 'string', default: 'PA' },
            },
          ],
        },
      },
    },
  };

  res.json(spec);
});
