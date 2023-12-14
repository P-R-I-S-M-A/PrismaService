

export function api(json){
    const request_body = JSON.parse(json);
    const user_data = request_body.users;
    // Imprimindo o JSON recebido
    console.log("JSON recebido:", request_body);
    console.log("USER_DATA:", user_data);

    // Inicializar arrays para cada coluna da matriz
    const ids = [];
    const disp = [];
    const ct = [];
    const php = [];
    const office = [];
    const java = [];
    const javascript = [];
    const python = [];
    const ruby = [];
    const assembly = [];
    const sql = [];
    const git = [];
    const linux = [];

    // Preencher arrays com os dados do JSON
    for (const user of user_data) {
        ids.push(user.id); // Manter a coluna de ids como string
        disp.push(parseInt(user.data.disp));
        ct.push(parseInt(user.data.ct));
        php.push(parseInt(user.data.skill[0].php));
        office.push(parseInt(user.data.skill[0].office));
        java.push(parseInt(user.data.skill[0].java));
        javascript.push(parseInt(user.data.skill[0].javascript));
        python.push(parseInt(user.data.skill[0].python));
        ruby.push(parseInt(user.data.skill[0].ruby));
        assembly.push(parseInt(user.data.skill[0].assembly));
        sql.push(parseInt(user.data.skill[0].sql));
        git.push(parseInt(user.data.skill[0].git));
        linux.push(parseInt(user.data.skill[0].linux));
    }

    console.log('IDs: ', ids)

    // Criar a matriz usando JavaScript
    const matrix = [
        Array.from({ length: ids.length }, (_, index) => index), // Coluna de índices
        disp,
        ct,
        php,
        office,
        java,
        javascript,
        python,
        ruby,
        assembly,
        sql,
        git,
        linux
    ].map(column => column.slice()); // Transpor a matriz (T)

    console.log('matrix: ', matrix)

    const matrixInvertida = ids.map((_, index) => [
        index,
        disp[index],
        ct[index],
        php[index],
        office[index],
        java[index],
        javascript[index],
        python[index],
        ruby[index],
        assembly[index],
        sql[index],
        git[index],
        linux[index]
      ]);

    console.log("matrixInvertida: ", matrixInvertida)

    // Objeto mapeando habilidades para índices
    const index = {
        'php': 3,
        'office': 4,
        'java': 5,
        'javascript': 6,
        'python': 7,
        'ruby': 8,
        'assembly': 9,
        'sql': 10,
        'git': 11,
        'linux': 12
    };
    
    console.log('index: ', index)

    // Acessar as habilidades requeridas dentro do arquivo JSON
    const task_json = request_body.tarefas;

    // Resgatar os índices correspondentes às habilidades requeridas
    const skills_index = task_json.map(skill => index[skill]);

    // Nova matriz apenas com as habilidades requeridas
    const users_skills = matrixInvertida.map(row => skills_index.map(index => row[index]));

    // users_skills é uma matriz onde cada linha representa um usuário e cada coluna representa uma habilidade requerida
    console.log('task_json: ', task_json)
    console.log('skills_index: ', skills_index)
    console.log('users_skills: ', users_skills)

    // Adicionar as três primeiras colunas de volta à nova matriz
    var usersSkillsWithFirstThreeColumns = users_skills.map((row, index) => [index, disp[index], ct[index], ...row]);

    // Contar quantas linhas têm pelo menos um valor 0 (com exceção das três primeiras, que representam o índice, disp e carga de trabalho)
    const linesWithZeros = usersSkillsWithFirstThreeColumns.filter(row => row.slice(3).some(value => value === 0)).length;

    console.log('usersSkillsWithFirstThreeColumns: ', usersSkillsWithFirstThreeColumns)
    console.log('linesWithZeros: ', linesWithZeros)

    // Verificar se a quantidade de linhas com zero é igual ou muito próxima ao total de linhas
    const limite_proximidade = 0.2; // 20% de tolerância para proximidade

    let verif_dom = 0;
    let userFiltradoSemZeros;

    if (linesWithZeros === 0) {

        verif_dom = usersSkillsWithFirstThreeColumns.length;
        
    } else {
        if (linesWithZeros < usersSkillsWithFirstThreeColumns.length * (1 - limite_proximidade)) {
            // Remover as linhas com pelo menos um valor 0
            userFiltradoSemZeros = usersSkillsWithFirstThreeColumns.filter(row => row.slice(3).every(value => value !== 0));
            

            verif_dom = userFiltradoSemZeros.length;
        } else {
            verif_dom = usersSkillsWithFirstThreeColumns.length;
        }
    }

    // Criando matriz vazia para salvar resultados
    const distances_results = Array.from({ length: verif_dom }, () => Array(1).fill(0));

    console.log('userFiltradoSemZeros', userFiltradoSemZeros)
    console.log('verif_dom', verif_dom)
    console.log('distances_results', distances_results)

    // Criar vetor com a quantidade de posições igual à quantidade de habilidades requeridas
    const skills_quant = skills_index.length;
    const skills_max = new Array(skills_quant).fill(10);

    // Nova matriz apenas com as habilidades requeridas
    const skills_dist = userFiltradoSemZeros.map(row => row.slice(3));

    console.log('skills_quant', skills_quant)
    console.log('skills_max', skills_max)
    console.log('skills_dist', skills_dist)


    // Verificando distância das habilidades
    for (let i = 0; i < verif_dom; i++) {
        const user_current = skills_dist[i];
        const user_current_reshaped = [user_current];
        const skills_max_reshaped = [skills_max];
        const variation = user_current_reshaped.map((row, rowIndex) =>
        row.map((value, colIndex) => value - skills_max_reshaped[rowIndex][colIndex])
        );
    
        const distance =  parseFloat(Math.sqrt(variation.flat().reduce((sum, value) => sum + value ** 2, 0)).toFixed(8));
        distances_results[i][0] = distance;
    }

    console.log('distances_results', distances_results)

    // Juntando os resultados de distância com a disponibilidade e a carga de trabalho
    const disp_cargat = userFiltradoSemZeros.map(row => row.slice(0, 3));
    const Novaverif_dom = disp_cargat.map((row, index) => [...row, distances_results[index][0]]);

    console.log('disp_cargat', disp_cargat)
    console.log('Novaverif_dom', Novaverif_dom)


    // Criar um "DataFrame" com os dados
    const columns = ['ID', 'Disponibilidade', 'Carga_de_Trabalho', 'Habilidade'];
    let df = Novaverif_dom.map(row => Object.fromEntries(columns.map((col, index) => [col, row[index]])));

    // Lista para armazenar o ranking
    const ranking = [];

    // Função para encontrar e atualizar usuários não dominados
    function findAndUpdateNonDominated(df) {
        const nonDominatedUsers = [];

        for (let i = 0; i < df.length; i++) {
            const currentUser = df[i];
            let isDominated = false;

            for (let j = 0; j < df.length; j++) {
            if (i !== j) {
                const otherUser = df[j];

                if (
                currentUser.Disponibilidade >= otherUser.Disponibilidade &&
                currentUser.Carga_de_Trabalho <= otherUser.Carga_de_Trabalho &&
                currentUser.Habilidade <= otherUser.Habilidade
                ) {
                isDominated = true;
                break;
                }
            }
            }

            if (!isDominated) {
            nonDominatedUsers.push(currentUser.ID);
            }
        }

        // Atualizar o ranking com os IDs dos usuários não dominados
        ranking.push(...nonDominatedUsers);

        // Remover usuários não dominados do "DataFrame"
        const dfFiltered = df.filter(user => !nonDominatedUsers.includes(user.ID));

        return dfFiltered;
    }

    // Repetir até que o "DataFrame" esteja vazio
    while (df.length > 0) {
        console.log('df', df)
    df = findAndUpdateNonDominated(df);
    }

  
    console.log('ranking', ranking)
}