const axios = require('axios');

// Função para obter e validar o token do Asaas
function getAsaasToken() {
    // Ler diretamente do process.env toda vez (não cachear)
    let token = process.env.ASAAS_API_KEY || '';
    
    // Se não tiver no env, usar fallback de sandbox
    if (!token || token.trim() === '') {
        console.warn('⚠️ ASAAS_API_KEY não encontrada no process.env, usando fallback de SANDBOX');
        token = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjcxMDA1NDNkLTc5YTUtNGVlMi05ZDkxLTc1NjU2YzQxZTNjOTo6JGFhY2hfNTUzMWNiNmQtYjdhNy00NWMxLTgxNTYtMzVkNDc5M2JmYmFh';
    }
    
    // Limpar o token: remover espaços, quebras de linha, etc.
    token = token.toString().trim();
    token = token.replace(/\s+/g, '').replace(/\r/g, '').replace(/\n/g, '');
    
    // Garantir que comece com $
    if (!token.startsWith('$')) {
        console.warn('⚠️ Token não começa com $, adicionando...');
        token = '$' + token;
    }
    
    // Validar tamanho mínimo (tokens Asaas têm pelo menos 150 caracteres)
    if (token.length < 150) {
        console.error('❌ ERRO CRÍTICO: Token parece estar truncado!');
        console.error('📏 Tamanho:', token.length, 'caracteres (esperado: 150+)');
        console.error('⚠️ Primeiros 50:', token.substring(0, 50));
        console.error('⚠️ Últimos 30:', token.substring(token.length - 30));
        throw new Error('Token Asaas inválido ou truncado. Verifique ASAAS_API_KEY no Render.');
    }
    
    return token;
}

// O token do Asaas deve começar com $ (obrigatório)
const ASAAS_TOKEN = process.env.ASAAS_API_KEY || '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmZjMDljMWE5LWFiZTQtNDQ2OC1iMzMxLTZhZjAxNzdjYmZiNjo6JGFhY2hfNzA5MmRmY2UtOTVjYS00OGY0LWFjN2MtMjcyM2I5YmQzZmJj';

// Detectar automaticamente se é sandbox ou produção baseado na chave
// Chaves de sandbox contêm "hmlg" (homologação)
// Chaves de produção contêm "prod" (produção)
const isSandbox = (ASAAS_TOKEN.includes('hmlg') || ASAAS_TOKEN.includes('_hmlg_')) && !ASAAS_TOKEN.includes('_prod_');
const isProduction = ASAAS_TOKEN.includes('_prod_') || (!ASAAS_TOKEN.includes('hmlg') && !ASAAS_TOKEN.includes('_hmlg_'));
const ASAAS_API_URL = isSandbox 
    ? 'https://sandbox.asaas.com/api/v3'
    : 'https://api.asaas.com/v3';

console.log('🔑 Ambiente Asaas detectado:', isSandbox ? 'SANDBOX (Teste)' : (isProduction ? 'PRODUÇÃO' : 'AUTO-DETECTADO'));
console.log('🌐 URL da API:', ASAAS_API_URL);
console.log('📏 Tamanho do token:', ASAAS_TOKEN.length, 'caracteres');
console.log('🔍 Token começa com $:', ASAAS_TOKEN.startsWith('$'));
console.log('🔍 Token contém "_prod_":', ASAAS_TOKEN.includes('_prod_'));
console.log('🔍 Token contém "hmlg":', ASAAS_TOKEN.includes('hmlg'));

// Garantir que o token comece com $
if (!ASAAS_TOKEN.startsWith('$')) {
    console.warn('⚠️ AVISO: O token do Asaas deve começar com $. Corrigindo automaticamente...');
    const correctedToken = '$' + ASAAS_TOKEN;
    module.exports.ASAAS_TOKEN = correctedToken;
}

const asaasClient = axios.create({
    baseURL: ASAAS_API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para adicionar o token de acesso
// IMPORTANTE: O Asaas aceita o token como HEADER "access_token"
asaasClient.interceptors.request.use((config) => {
    // Obter token fresco do process.env (não usar cache)
    let token = getAsaasToken();
    
    // Log detalhado para debug
    console.log('🔑 === TOKEN ASAAS PARA REQUISIÇÃO ===');
    console.log('📏 Tamanho:', token.length, 'caracteres');
    console.log('🔍 Primeiros 60:', token.substring(0, 60));
    console.log('🔍 Últimos 30:', token.substring(token.length - 30));
    console.log('🔍 Começa com $:', token.startsWith('$'));
    console.log('🔍 Contém "hmlg":', token.includes('hmlg'));
    console.log('🔍 URL da requisição:', config.url);
    console.log('=====================================');
    
    // Adicionar token como header (Formato correto do Asaas)
    // IMPORTANTE: O Asaas espera o token EXATAMENTE como está, sem modificações
    config.headers['access_token'] = token;
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor de resposta para capturar erros 401 com mais detalhes
asaasClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.error('❌ ERRO 401 - AUTENTICAÇÃO FALHOU');
            console.error('📋 URL:', error.config?.url);
            console.error('📋 Método:', error.config?.method);
            console.error('📋 Headers enviados:', JSON.stringify(error.config?.headers, null, 2));
            console.error('📋 Token usado (primeiros 50):', error.config?.headers?.access_token?.substring(0, 50));
            console.error('📋 Resposta do Asaas:', JSON.stringify(error.response.data, null, 2));
            
            // Verificar se o token está presente
            if (!error.config?.headers?.access_token) {
                console.error('❌ PROBLEMA: Token não está sendo enviado no header!');
            } else {
                const token = error.config.headers.access_token;
                console.error('📏 Tamanho do token enviado:', token.length);
                console.error('🔍 Token começa com $:', token.startsWith('$'));
                console.error('🔍 Token contém "hmlg":', token.includes('hmlg'));
            }
        }
        return Promise.reject(error);
    }
);

/**
 * Buscar cliente existente no Asaas por email
 */
async function findCustomerByEmail(email) {
    try {
        console.log('🔍 Buscando cliente por email:', email);
        const response = await asaasClient.get('/customers', {
            params: {
                email: email
            }
        });
        
        console.log('📋 Resposta da busca:', JSON.stringify(response.data, null, 2));
        
        // Se encontrar clientes, retornar o primeiro
        if (response.data && response.data.data && response.data.data.length > 0) {
            const customer = response.data.data[0];
            console.log('✅ Cliente encontrado no Asaas:');
            console.log('   ID:', customer.id);
            console.log('   Nome:', customer.name);
            console.log('   Email:', customer.email);
            console.log('   CPF/CNPJ:', customer.cpfCnpj || '❌ NÃO TEM');
            return customer;
        }
        console.log('❌ Nenhum cliente encontrado com email:', email);
        return null;
    } catch (error) {
        console.error('❌ Erro ao buscar cliente no Asaas:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

/**
 * Buscar cliente existente no Asaas por ID
 */
async function findCustomerById(customerId) {
    try {
        const response = await asaasClient.get(`/customers/${customerId}`);
        if (response.data) {
            console.log('✅ Cliente encontrado por ID:', response.data.id, '- Nome:', response.data.name);
            return response.data;
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar cliente por ID no Asaas:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Atualizar cliente existente no Asaas
 */
async function updateCustomer(customerId, customerData) {
    try {
        const customerPayload = {};
        
        if (customerData.name) customerPayload.name = customerData.name;
        if (customerData.email) customerPayload.email = customerData.email;
        if (customerData.phone) {
            const phone = customerData.phone.replace(/\D/g, '');
            if (phone.length >= 10) {
                customerPayload.phone = phone;
                customerPayload.mobilePhone = customerData.mobilePhone ? customerData.mobilePhone.replace(/\D/g, '') : phone;
            }
        }
        // CPF/CNPJ é obrigatório para atualizar
        if (customerData.cpfCnpj) {
            customerPayload.cpfCnpj = customerData.cpfCnpj.replace(/\D/g, ''); // Remover formatação
        }
        
        console.log('=== ATUALIZANDO CLIENTE ===');
        console.log('Cliente ID:', customerId);
        console.log('Dados a atualizar:', JSON.stringify(customerPayload, null, 2));
        
        const response = await asaasClient.put(`/customers/${customerId}`, customerPayload);
        
        console.log('✅ Cliente atualizado com sucesso');
        console.log('Resposta:', JSON.stringify(response.data, null, 2));
        
        return response.data;
    } catch (error) {
        console.error('❌ Erro ao atualizar cliente no Asaas:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados do erro:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

/**
 * Criar um cliente no Asaas
 */
async function createCustomer(customerData) {
    try {
        // Preparar dados do cliente (remover campos null/undefined)
        const customerPayload = {
            name: customerData.name,
            email: customerData.email
        };
        
        // Adicionar telefone apenas se fornecido e no formato correto
        if (customerData.phone) {
            // Remover caracteres não numéricos e garantir formato
            const phone = customerData.phone.replace(/\D/g, '');
            if (phone.length >= 10) {
                customerPayload.phone = phone;
                customerPayload.mobilePhone = customerData.mobilePhone ? customerData.mobilePhone.replace(/\D/g, '') : phone;
            }
        }
        
        // IMPORTANTE: Para criar cobranças PIX, o Asaas exige CPF ou CNPJ
        // Se não fornecido, usar um CPF genérico de teste (apenas para testes)
        if (customerData.cpfCnpj) {
            customerPayload.cpfCnpj = customerData.cpfCnpj.replace(/\D/g, ''); // Remover formatação
        } else {
            // Gerar CPF genérico de teste (11 dígitos) - apenas para desenvolvimento
            // Em produção, o CPF deve ser obrigatório no formulário
            console.warn('⚠️ AVISO: CPF não fornecido. Usando CPF genérico de teste.');
            customerPayload.cpfCnpj = '00000000000';
        }
        
        // Adicionar outros campos apenas se fornecidos
        if (customerData.postalCode) customerPayload.postalCode = customerData.postalCode;
        if (customerData.address) customerPayload.address = customerData.address;
        if (customerData.addressNumber) customerPayload.addressNumber = customerData.addressNumber;
        if (customerData.complement) customerPayload.complement = customerData.complement;
        if (customerData.province) customerPayload.province = customerData.province;
        if (customerData.city) customerPayload.city = customerData.city;
        if (customerData.state) customerPayload.state = customerData.state;
        
        console.log('Dados do cliente a serem enviados:', JSON.stringify(customerPayload, null, 2));
        
        const response = await asaasClient.post('/customers', customerPayload);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar cliente no Asaas:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados do erro:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

/**
 * Buscar ou criar cliente no Asaas (reutiliza cliente existente)
 */
async function getOrCreateCustomer(customerData) {
    try {
        console.log('=== INICIANDO BUSCA/CRIAÇÃO DE CLIENTE ===');
        console.log('Dados fornecidos:', JSON.stringify(customerData, null, 2));
        
        // Dados do cliente de teste (usar para todos os pagamentos se necessário)
        const TEST_CUSTOMER_EMAIL = 'luhandev.vini@gmail.com';
        const TEST_CUSTOMER_CPF = '09170048339';
        
        // Se não tem CPF fornecido, usar o CPF do cliente de teste
        if (!customerData.cpfCnpj) {
            console.log('⚠️ CPF não fornecido. Usando CPF do cliente de teste para garantir que funcione.');
            customerData.cpfCnpj = TEST_CUSTOMER_CPF;
        }
        
        // Primeiro, tentar buscar cliente existente por email
        if (customerData.email) {
            const existingCustomer = await findCustomerByEmail(customerData.email);
            if (existingCustomer) {
                console.log('✅ Cliente existente encontrado no Asaas:', existingCustomer.id);
                console.log('   Nome:', existingCustomer.name);
                console.log('   CPF/CNPJ:', existingCustomer.cpfCnpj || '❌ NÃO TEM');
                
                // IMPORTANTE: Verificar se o cliente tem CPF/CNPJ (obrigatório para PIX)
                // Se não tiver, atualizar com o CPF fornecido (ou do cliente de teste)
                if (!existingCustomer.cpfCnpj) {
                    console.log('⚠️ Cliente existente sem CPF/CNPJ. Atualizando com CPF fornecido...');
                    try {
                        const updatedCustomer = await updateCustomer(existingCustomer.id, {
                            cpfCnpj: customerData.cpfCnpj.replace(/\D/g, '') // Remover formatação
                        });
                        console.log('✅ Cliente atualizado com CPF:', updatedCustomer.cpfCnpj);
                        return updatedCustomer;
                    } catch (updateError) {
                        console.error('❌ Erro ao atualizar CPF do cliente:', updateError.response?.data || updateError.message);
                        // Se não conseguir atualizar, lançar erro pois é obrigatório para PIX
                        throw new Error('Cliente existente sem CPF/CNPJ e não foi possível atualizar. CPF é obrigatório para criar cobranças PIX.');
                    }
                }
                
                console.log('✅ Usando cliente existente com CPF válido');
                console.log('   Cliente ID:', existingCustomer.id);
                console.log('   CPF:', existingCustomer.cpfCnpj);
                return existingCustomer;
            }
        }
        
        // Se não encontrou, criar novo cliente
        console.log('📝 Cliente não encontrado. Criando novo cliente no Asaas...');
        console.log('   Email:', customerData.email);
        console.log('   CPF a ser usado:', customerData.cpfCnpj || 'NÃO FORNECIDO');
        const newCustomer = await createCustomer(customerData);
        console.log('✅ Novo cliente criado:', newCustomer.id);
        console.log('   CPF:', newCustomer.cpfCnpj || 'NÃO TEM');
        return newCustomer;
    } catch (error) {
        console.error('❌ Erro ao buscar/criar cliente no Asaas:', error);
        throw error;
    }
}

/**
 * Criar um pagamento no Asaas
 */
async function createPayment(paymentData) {
    try {
        const response = await asaasClient.post('/payments', {
            customer: paymentData.customerId,
            billingType: paymentData.billingType || 'BOLETO', // BOLETO, CREDIT_CARD, PIX, etc
            value: paymentData.value,
            dueDate: paymentData.dueDate, // Formato: YYYY-MM-DD
            description: paymentData.description || 'Agendamento de Consulta',
            externalReference: paymentData.externalReference || null,
            installmentCount: paymentData.installmentCount || 1,
            installmentValue: paymentData.installmentValue || paymentData.value
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao criar pagamento no Asaas:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Criar pagamento PIX (mais rápido)
 */
async function createPixPayment(paymentData) {
    try {
        // Validar que temos o customerId
        if (!paymentData || !paymentData.customerId) {
            console.error('❌ paymentData recebido:', JSON.stringify(paymentData, null, 2));
            throw new Error('customerId é obrigatório para criar pagamento PIX. Recebido: ' + (paymentData?.customerId || 'undefined'));
        }
        
        // Converter customerId para string e validar
        const customerId = String(paymentData.customerId).trim();
        if (!customerId || customerId === 'undefined' || customerId === 'null' || customerId === '') {
            throw new Error('customerId inválido: "' + customerId + '"');
        }
        
        // Validar valor
        const value = parseFloat(paymentData.value);
        if (isNaN(value) || value <= 0) {
            throw new Error('Valor inválido: ' + paymentData.value);
        }
        
        // Validar data
        if (!paymentData.dueDate) {
            throw new Error('dueDate é obrigatório');
        }
        
        // Preparar payload do pagamento
        // IMPORTANTE: O campo deve ser "customer" (string com o ID) e "billingType" deve ser "PIX"
        const paymentPayload = {
            customer: customerId, // ID do cliente como string
            billingType: 'PIX', // Deve ser exatamente "PIX" (não pode ser undefined)
            value: value.toFixed(2), // Garantir 2 casas decimais
            dueDate: paymentData.dueDate // Formato: YYYY-MM-DD
        };
        
        if (paymentData.description) {
            paymentPayload.description = String(paymentData.description);
        }
        
        if (paymentData.externalReference) {
            paymentPayload.externalReference = String(paymentData.externalReference);
        }
        
        // Validar que billingType não está undefined
        if (!paymentPayload.billingType || paymentPayload.billingType === 'undefined') {
            throw new Error('billingType não pode ser undefined. Deve ser "PIX"');
        }
        
        console.log('=== DADOS DO PAGAMENTO PIX A SEREM ENVIADOS ===');
        console.log(JSON.stringify(paymentPayload, null, 2));
        console.log('Customer ID:', paymentPayload.customer);
        console.log('Customer ID (tipo):', typeof paymentPayload.customer);
        console.log('Billing Type:', paymentPayload.billingType);
        console.log('Billing Type (tipo):', typeof paymentPayload.billingType);
        console.log('Value:', paymentPayload.value);
        console.log('Due Date:', paymentPayload.dueDate);
        console.log('===============================================');
        
        const response = await asaasClient.post('/payments', paymentPayload);
        
        // Log da resposta para debug
        console.log('=== RESPOSTA DO ASAAS PIX ===');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('=============================');
        
        return response.data;
    } catch (error) {
        console.error('=== ERRO AO CRIAR PAGAMENTO PIX NO ASAAS ===');
        console.error('Erro completo:', error.message);
        console.error('Stack:', error.stack);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('URL:', error.config?.url);
            if (error.config?.data) {
                try {
                    const sentData = typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data;
                    console.error('Dados enviados:', JSON.stringify(sentData, null, 2));
                } catch (e) {
                    console.error('Dados enviados (raw):', error.config.data);
                }
            }
            console.error('Dados do erro:', JSON.stringify(error.response.data, null, 2));
        }
        console.error('=============================================');
        throw error;
    }
}

/**
 * Obter QR Code PIX de um pagamento
 * Endpoint: GET /payments/{id}/pixQrCode
 * Retorna: { encodedImage, payload, expirationDate }
 */
async function getPixQrCode(paymentId) {
    try {
        console.log('=== BUSCANDO QR CODE PIX ===');
        console.log('Payment ID:', paymentId);
        console.log('Endpoint: GET /payments/' + paymentId + '/pixQrCode');
        
        const response = await asaasClient.get(`/payments/${paymentId}/pixQrCode`);
        
        console.log('=== RESPOSTA DO QR CODE PIX ===');
        console.log(JSON.stringify(response.data, null, 2));
        console.log('Campos disponíveis:');
        console.log('  - encodedImage:', response.data.encodedImage ? 'Presente (' + response.data.encodedImage.substring(0, 50) + '...)' : 'Ausente');
        console.log('  - payload:', response.data.payload ? 'Presente (' + response.data.payload.substring(0, 50) + '...)' : 'Ausente');
        console.log('  - expirationDate:', response.data.expirationDate || 'Ausente');
        console.log('=============================');
        
        return response.data;
    } catch (error) {
        console.error('❌ Erro ao obter QR Code PIX:', error.response?.data || error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados do erro:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
}

/**
 * Verificar status de um pagamento
 */
async function getPaymentStatus(paymentId) {
    try {
        const response = await asaasClient.get(`/payments/${paymentId}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    createCustomer,
    updateCustomer,
    findCustomerByEmail,
    findCustomerById,
    getOrCreateCustomer,
    createPayment,
    createPixPayment,
    getPixQrCode,
    getPaymentStatus
};

