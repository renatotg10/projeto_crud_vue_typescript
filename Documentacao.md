# Tutorial CRUD Básico com TypeScript e Vue.js
`Autor: Renato Teixeira Gomes - renatotgomes.dev@gmail.com`

Neste tutorial iremos desenvolver um CRUD utilizando o TypeScript com Back-End e Vue.js como Front-End.

## Desenvolvimento do  Back-End com o TypeScript

### 1. Estrutura do Projeto e Configuração do Ambiente

1. **Configuração do Banco de Dados (MySQL)**:
   - Crie um banco de dados MySQL chamado `empresa`.
   - Crie uma tabela `colaboradores` com os seguintes campos:
     ```sql
     CREATE TABLE colaboradores (
         id INT PRIMARY KEY AUTO_INCREMENT,
         nome VARCHAR(100),
         cargo VARCHAR(50),
         salario DECIMAL(10, 2),
         data_admissao DATE
     );
     ```

2. **Backend com Node.js + TypeScript**:
   - Instale o Node.js e inicialize o projeto:
     ```bash
     mkdir empresa-crud
     cd empresa-crud
     npm init -y
     ```
   - Instale os pacotes necessários:
     ```bash
     npm install express mysql2 typescript ts-node dotenv
     npm install @types/express --save-dev
     ```

   - Configure o TypeScript:
     ```bash
     npx tsc --init
     ```
     Configure `tsconfig.json` para definir o diretório de saída (`outDir`) como `dist` e ativar `strict`.

3. **Estrutura de Pastas**:
   - Organize seu Back-End com esta estrutura:
     ```
     ├── src
     │   ├── controllers
     │   ├── models
     │   ├── routes
     │   ├── config
     │   └── app.ts
     └── dist
     ```

4. **Configuração do DOTENV**

O arquivo para configurar variáveis de ambiente com o `dotenv` é o `.env`, e ele normalmente fica na raiz do projeto (ou seja, no mesmo diretório onde está o `package.json`).

 - **Crie um arquivo** chamado `.env` na raiz do projeto, caso ele ainda não exista.
   
 - **Adicione suas variáveis de ambiente** no arquivo `.env`. Cada variável deve estar em uma linha separada no formato `NOME_VARIAVEL=valor`. Por exemplo:

  ```dotenv
  PORT=3006
  DB_HOST=localhost
  DB_USER=nome_usuario
  DB_PASS=sua_senha
  DB_NAME=empresa
  ```

- **Ignorando o `.env`**

  Por segurança, **não é recomendado enviar o arquivo `.env` ao controle de versão (como o Git)**, pois ele pode conter informações sensíveis. Para evitar que o `.env` seja versionado, adicione-o ao arquivo `.gitignore`:

  ```
  .env
  ```

  Isso ajudará a manter suas variáveis de ambiente seguras e evitará compartilhamento acidental de informações confidenciais.

### 2. Configuração do Banco de Dados (Arquivo `config/database.ts`)

```typescript
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
}).promise();

export default pool;
```

**Testando o Banco de Dados**

Crie um arquivo separado, como testDatabase.ts, para verificar se a conexão com o banco de dados está funcionando e se a tabela está acessível.

```typescript
import pool from './src/config/database';

async function testDatabaseConnection() {
  try {
    // Testa a conexão com o banco de dados
    const connection = await pool.getConnection();
    console.log("Conexão com o banco de dados bem-sucedida!");

    // Verifica se a tabela está acessível
    const [rows] = await connection.query<any[]>('SHOW TABLES LIKE "colaboradores"');
    
    if (rows.length > 0) {
      console.log("Tabela 'colaboradores' encontrada!");
    } else {
      console.log("Tabela 'colaboradores' não encontrada.");
    }

    connection.release();
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
  } finally {
    pool.end(); // Fecha a conexão após o teste
  }
}

testDatabaseConnection();
```

#### Como Rodar o Teste

Execute o arquivo `testDatabase.ts` com o comando:

```bash
npx ts-node testDatabase.ts
```

#### Explicação do Código

- **`pool.getConnection()`**: Obtém uma conexão do pool para verificar se a conexão está ativa.
- **`SHOW TABLES LIKE "nome_da_tabela"`**: Este comando SQL lista as tabelas do banco de dados que correspondem ao nome especificado (`nome_da_tabela`). Se a tabela existir, o array `rows` conterá resultados; caso contrário, ele estará vazio.
- **`connection.release()`**: Libera a conexão de volta ao pool para que possa ser reutilizada.
- **`pool.end()`**: Fecha a conexão após o teste.

Se a conexão e a tabela estiverem configuradas corretamente, você verá mensagens indicando que o banco de dados e a tabela foram encontrados.

### 3. Modelo (Arquivo `models/Colaborador.ts`)

```typescript
import pool from '../config/database';

export interface Colaborador {
    id?: number;
    nome: string;
    cargo: string;
    salario: number;
    data_admissao: string;
}

export class ColaboradorModel {
    static async listar(): Promise<Colaborador[]> {
        const [rows] = await pool.query("SELECT * FROM colaboradores");
        return rows as Colaborador[];
    }
    static async criar(colaborador: Colaborador): Promise<void> {
        await pool.query("INSERT INTO colaboradores SET ?", colaborador);
    }
    static async atualizar(id: number, colaborador: Colaborador): Promise<void> {
        await pool.query("UPDATE colaboradores SET ? WHERE id = ?", [colaborador, id]);
    }
    static async excluir(id: number): Promise<void> {
        await pool.query("DELETE FROM colaboradores WHERE id = ?", [id]);
    }
}
```

### 4. Controlador (Arquivo `controllers/ColaboradorController.ts`)

```typescript
import { Request, Response } from 'express';
import { ColaboradorModel, Colaborador } from '../models/Colaborador';

export class ColaboradorController {
    static async listar(req: Request, res: Response) {
        const colaboradores = await ColaboradorModel.listar();
        res.json(colaboradores);
    }
    static async criar(req: Request, res: Response) {
        const colaborador: Colaborador = req.body;
        await ColaboradorModel.criar(colaborador);
        res.status(201).json({ message: 'Colaborador criado!' });
    }
    static async atualizar(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        const colaborador: Colaborador = req.body;
        await ColaboradorModel.atualizar(id, colaborador);
        res.json({ message: 'Colaborador atualizado!' });
    }
    static async excluir(req: Request, res: Response) {
        const id = parseInt(req.params.id);
        await ColaboradorModel.excluir(id);
        res.json({ message: 'Colaborador excluído!' });
    }
}
```

### 5. Rotas (Arquivo `routes/colaboradorRoutes.ts`)

```typescript
import express from 'express';
import { ColaboradorController } from '../controllers/ColaboradorController';

const router = express.Router();

router.get('/colaboradores', ColaboradorController.listar);
router.post('/colaboradores', ColaboradorController.criar);
router.put('/colaboradores/:id', ColaboradorController.atualizar);
router.delete('/colaboradores/:id', ColaboradorController.excluir);

export default router;
```

### 6. Configuração do Servidor (Arquivo `app.ts`)

```typescript
import express from 'express';
import bodyParser from 'body-parser';
import colaboradorRoutes from './routes/colaboradorRoutes';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.use('/api', colaboradorRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
```

### 7. Executando o servidor do Back-End

Para executar o Back-End que foi desenvolvido com Node.js e TypeScript, siga os passos abaixo:

1. **Compilar o Código TypeScript**:
   Primeiro, você precisa compilar o código TypeScript para JavaScript. Execute o seguinte comando:

   ```bash
   npx tsc
   ```

   Isso vai gerar os arquivos compilados dentro da pasta `dist` (ou conforme o diretório configurado em seu `tsconfig.json`).

2. **Rodar o Servidor com `ts-node`**:
   Caso queira rodar diretamente os arquivos TypeScript sem compilar manualmente, você pode usar o `ts-node`. Execute o comando abaixo:

   ```bash
   npx ts-node src/app.ts
   ```

3. **Rodar o Servidor em Produção (compilado)**:
   Se você já compilou o código (usando `npx tsc`), pode rodar o servidor em produção com o comando:

   ```bash
   node dist/app.js
   ```

Se o seu `app.ts` estiver corretamente configurado, o servidor começará a rodar na porta definida, geralmente a `3000`, e você verá a mensagem `"Servidor rodando na porta 3000"` no terminal.

### 7. Front-End com Vue.js

Vamos montar a estrutura do Front-End em Vue para o CRUD de colaboradores. O Front-End vai consumir a API que você criou no Back-End para gerenciar colaboradores. Vou explicar cada passo para que o sistema fique completo e funcional.

---

## Desenvolvimento do Front-End com o Vue.js

### 1. Criação do Projeto Vue

1. **Inicializar o Projeto Vue**:
   ```bash
   vue create empresa-crud-frontend
   cd empresa-crud-frontend
   ```

2. **Instalar o Axios** (para fazer requisições HTTP):
   ```bash
   npm install axios
   ```

3. **Estrutura de Pastas**:
   Organize a estrutura do Front-End da seguinte forma:
   ```
   ├── src
   │   ├── components
   │   │   ├── ListaColaboradores.vue
   │   │   └── FormColaborador.vue
   │   ├── views
   │   │   └── Home.vue
   │   ├── App.vue
   │   ├── main.js
   └── ...
   ```

---

### 2. Configurar Axios para Requisições

No arquivo `src/main.js`, importe e configure o Axios para definir o URL base da API:

```javascript
import Vue from 'vue';
import App from './App.vue';
import axios from 'axios';

Vue.config.productionTip = false;

axios.defaults.baseURL = 'http://localhost:3000/api';

new Vue({
  render: h => h(App),
}).$mount('#app');
```

---

### 3. Criar Componentes Vue

#### 3.1. `ListaColaboradores.vue` (Lista de Colaboradores)

Este componente exibirá uma lista de colaboradores e permitirá excluir um colaborador.

```vue
<template>
  <div>
    <h2>Lista de Colaboradores</h2>
    <button @click="$emit('adicionar')">Adicionar Novo Colaborador</button>
    <ul>
      <li v-for="colaborador in colaboradores" :key="colaborador.id">
        <strong>{{ colaborador.nome }}</strong> - {{ colaborador.cargo }} - R$ {{ colaborador.salario }}
        <button @click="$emit('editar', colaborador)">Editar</button>
        <button @click="excluirColaborador(colaborador.id)">Excluir</button>
      </li>
    </ul>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      colaboradores: [],
    };
  },
  methods: {
    async fetchColaboradores() {
      const response = await axios.get('/colaboradores');
      this.colaboradores = response.data;
    },
    async excluirColaborador(id) {
      await axios.delete(`/colaboradores/${id}`);
      this.fetchColaboradores();
    },
  },
  mounted() {
    this.fetchColaboradores();
  },
};
</script>
```

#### 3.2. `FormColaborador.vue` (Formulário de Colaboradores)

Este componente será usado para adicionar e editar colaboradores.

```vue
<template>
  <div>
    <h2>{{ colaborador.id ? 'Editar Colaborador' : 'Novo Colaborador' }}</h2>
    <form @submit.prevent="salvarColaborador">
      <div>
        <label>Nome:</label>
        <input v-model="colaborador.nome" required />
      </div>
      <div>
        <label>Cargo:</label>
        <input v-model="colaborador.cargo" required />
      </div>
      <div>
        <label>Salário:</label>
        <input v-model.number="colaborador.salario" type="number" required />
      </div>
      <div>
        <label>Data de Admissão:</label>
        <input v-model="colaborador.data_admissao" type="date" required />
      </div>
      <button type="submit">Salvar</button>
      <button @click="$emit('cancelar')">Cancelar</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  props: ['colaboradorInicial'],
  data() {
    return {
      colaborador: {
        id: null,
        nome: '',
        cargo: '',
        salario: 0,
        data_admissao: '',
      },
    };
  },
  watch: {
    colaboradorInicial: {
      immediate: true,
      handler(newVal) {
        this.colaborador = { ...newVal };
      },
    },
  },
  methods: {
    async salvarColaborador() {
      if (this.colaborador.id) {
        await axios.put(`/colaboradores/${this.colaborador.id}`, this.colaborador);
      } else {
        await axios.post('/colaboradores', this.colaborador);
      }
      this.$emit('salvo');
    },
  },
};
</script>
```

---

### 4. Criar a View Principal (`Home.vue`)

A View `Home.vue` exibirá a lista de colaboradores e o formulário para adicionar ou editar um colaborador. Usaremos `ListaColaboradores` e `FormColaborador` aqui.

```vue
<template>
  <div>
    <h1>Gestão de Colaboradores</h1>
    <ListaColaboradores
      v-if="!mostrandoFormulario"
      @adicionar="mostrarFormularioNovo"
      @editar="mostrarFormularioEditar"
    />
    <FormColaborador
      v-if="mostrandoFormulario"
      :colaboradorInicial="colaboradorAtual"
      @salvo="atualizarLista"
      @cancelar="esconderFormulario"
    />
  </div>
</template>

<script>
import ListaColaboradores from '@/components/ListaColaboradores.vue';
import FormColaborador from '@/components/FormColaborador.vue';

export default {
  components: {
    ListaColaboradores,
    FormColaborador,
  },
  data() {
    return {
      mostrandoFormulario: false,
      colaboradorAtual: null,
    };
  },
  methods: {
    mostrarFormularioNovo() {
      this.colaboradorAtual = {
        nome: '',
        cargo: '',
        salario: 0,
        data_admissao: '',
      };
      this.mostrandoFormulario = true;
    },
    mostrarFormularioEditar(colaborador) {
      this.colaboradorAtual = colaborador;
      this.mostrandoFormulario = true;
    },
    esconderFormulario() {
      this.mostrandoFormulario = false;
      this.colaboradorAtual = null;
    },
    atualizarLista() {
      this.esconderFormulario();
      this.$refs.lista.fetchColaboradores();
    },
  },
};
</script>
```

---

### 5. Integrar com o `App.vue`

No arquivo `App.vue`, importe e use a `Home.vue`:

```vue
<template>
  <div id="app">
    <Home />
  </div>
</template>

<script>
import Home from './views/Home.vue';

export default {
  components: {
    Home,
  },
};
</script>
```

---

### 6. Executar o Projeto

1. Certifique-se de que o Back-End esteja em execução.
2. No terminal do projeto Vue, execute:
   ```bash
   npm run serve
   ```

Agora, você terá o Front-End do CRUD de colaboradores em Vue.js conectado ao Back-End em TypeScript.