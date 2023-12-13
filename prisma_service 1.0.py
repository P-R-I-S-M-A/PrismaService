import json
import numpy as np
import pandas as pd

def lambda_handler(event, context):
    
    print("Conteúdo do evento:", event)
    
    # Configurar os cabeçalhos CORS
    headers = {
        'Access-Control-Allow-Origin': 'http://*',  # Substitua pela origem do seu aplicativo
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
    }

    try:
            
        # Verificar se a solicitação é uma opção pré-voo (preflight)
        if 'httpMethod' in event.get('requestContext', {}):
            if event['httpMethod'] == 'OPTIONS':
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({})
                }
                
        print("Evento após a verificação do método HTTP:", event)
            
        # Check se 'body' está presente no evento e não está vazio
        if 'body' not in event or not event['body']:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Missing or empty JSON body'})
            }

        request_body = json.loads(event['body'])
        print("JSON recebido:", request_body)

        # Check se 'users' está presente no request_body
        if 'users' not in request_body:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Key "users" not found in JSON'})
            }

        user_data = list(request_body['users'])
        
        # Inicializar listas para cada coluna da matriz
        ids = []
        disp = []
        ct = []
        php = []
        office = []
        java = []
        javascript = []
        python = []
        ruby = []
        assembly = []
        sql = []
        git = []
        linux = []

        # Preencher listas com os dados do JSON
        for user in user_data:
            ids.append((user["id"]))  # Manter a coluna de ids como string
            disp.append(int(user["data"]["disp"]))
            ct.append(int(user["data"]["ct"]))
            php.append(int(user["data"]["skill"][0]["php"]))
            office.append(int(user["data"]["skill"][0]["office"]))
            java.append(int(user["data"]["skill"][0]["java"]))
            javascript.append(int(user["data"]["skill"][0]["javascript"]))
            python.append(int(user["data"]["skill"][0]["python"]))
            ruby.append(int(user["data"]["skill"][0]["ruby"]))
            assembly.append(int(user["data"]["skill"][0]["assembly"]))
            sql.append(int(user["data"]["skill"][0]["sql"]))
            git.append(int(user["data"]["skill"][0]["git"]))
            linux.append(int(user["data"]["skill"][0]["linux"]))

        # Criar a matriz usando NumPy
        matrix = np.array([range(0, len(ids)), disp, ct, php, office, java, javascript, python, ruby, assembly, sql, git, linux]).T
        
        # Dicionário mapeando habilidades para índices
        index = {
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
        }
        
        # Acessar as habilidades requeridas dentro do arquivo JSON
        task_json = list(request_body['tarefas'])
        
        # Resgatar os índices correspondentes às habilidades requeridas
        skills_index = [index[skill] for skill in task_json]
        
        # Nova matriz apenas com as habilidades requeridas
        users_skills = matrix[:, skills_index]
        
        # Adicionar as três primeiras colunas de volta à nova matriz
        users_skills = np.concatenate((matrix[:, :3], users_skills), axis=1)
        
        # Contar quantas linhas têm pelo menos um valor 0 (com exceção três primeiras, que representam o index, a disp e a carga de trabalho)
        lines_with_zeros = np.sum(np.any(users_skills[:, 3:] == 0, axis=1))
        
        # Verificar se a quantidade de linhas com zero é igual ou muito próxima ao total de linhas
        limite_proximidade = 0.2  # 20% de tolerância para proximidade
        if lines_with_zeros == 0:
            verif_dom = users_skills.shape[0]
        else:
            if lines_with_zeros < len(users_skills) * (1 - limite_proximidade):
                # Remover as linhas com pelo menos um valor 0
                users_skills = users_skills[~np.any(users_skills[:, 3:] == 0, axis=1)]
                verif_dom = users_skills.shape[0]
            else:
                verif_dom = users_skills.shape[0]
                
        # Criando matriz vazia para salvar resultados
        distances_results = np.zeros((verif_dom, 1))
        
        #Criar vetor com a quantidade de posições igual a quantidades de habilidades requeridas
        skills_quant = len(skills_index)
        skills_max = np.full(skills_quant, 10)
        
        # Nova matriz apenas com as habilidades requeridas
        skills_dist = users_skills[:, 3:]
        
        # Verificando distancia das habilidades
        for i in range(verif_dom):
          user_current = skills_dist[i, :]
          user_current_reshaped = user_current.reshape(1, -1)
          skills_max_reshaped = skills_max.reshape(1, -1)
          variation = user_current_reshaped - skills_max_reshaped
          distance = np.linalg.norm(variation)
          distances_results[i, 0] = distance
          
        # Juntando os resultados de distancia com a disponibilidade e a carga de trabalho
        disp_cargat = users_skills[:, :3]
        verif_dom = np.hstack((disp_cargat, distances_results))
        
        # Função para encontrar os usuários não dominados e atualizar a matriz
        def find_and_update_non_dominated(df):
            non_dominated_users = []
            
            for idx, row in df.iterrows():
                filtered = df[(df['Disponibilidade'] >= row['Disponibilidade']) &
                              (df['Carga_de_Trabalho'] <= row['Carga_de_Trabalho']) &
                              (df['Habilidade'] <= row['Habilidade'])]
        
                if len(filtered) == 1:
                    non_dominated_users.append(int(row['ID']))
        
            # Atualizar o ranking com os IDs dos usuários não dominados
            ranking.extend(non_dominated_users)
            
            # Remover usuários não dominados do DataFrame
            df_filtered = df[~df['ID'].isin(non_dominated_users)]
            
            return df_filtered
        
        # Criando um DataFrame com os dados
        columns = ['ID', 'Disponibilidade', 'Carga_de_Trabalho', 'Habilidade']
        df = pd.DataFrame(verif_dom, columns=columns)
        
        # Lista para armazenar o ranking
        ranking = []
        
        # Repetir até que a matriz esteja vazia
        while not df.empty:
            df = find_and_update_non_dominated(df)
            
        # Seus arrays
        ranking = np.array(ranking)
        ids = np.array(ids)
        
        # Criar o array reorganizado
        ranking_organized = ids[ranking]
        
        # Convertendo para lista
        lst_ranking = ranking_organized.tolist()
        
        print(lst_ranking)

        # Lógica principal da sua função Lambda aqui
        # ...

        # Exemplo de resposta da API
        response = {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'ranking': lst_ranking}),
        }

        return response

    except json.JSONDecodeError as e:
        print("Erro ao decodificar JSON:", str(e))
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Error decoding JSON'}),
        }