const bcrypt = require('bcryptjs');

const gerarSenha = async () => {
    const senha = 'servidor02';  // 🔑 Altere para a senha desejada
    const hashedPassword = await bcrypt.hash(senha, 10);
    console.log('Senha criptografada:', hashedPassword);
};

gerarSenha();

