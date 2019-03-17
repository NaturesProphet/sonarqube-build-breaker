/*
* ALGORITMO:
* 1) le o valor da chave ceTaskUrl em .scannerwork/report-task.txt
* 2) enviar um GET com o taskId informado no passo 1 e aguardar até que o campo status
*    dentro da resposta seja um desses valores: SUCCESS, CANCELED or FAILED
* 3) se o status for FAILED ou CANCELED, quebrar a build dando um process.exit(9000);
* 4) se o status for SUCCESS:
*   4.1) ler o valor da chave analysisId que está na resposta do passo 2
*   4.2) enviar imediatamente um GET à rota /api/qualitygates/project_status?analysisId=<passo4.2>
*        e finalmente verificar o status do quality gate.
*   4.3) Se a chave status na resposta do passo 4.2 for "OK", conclui sem erros.
*   4.4) se a chave status for diferente de OK, quebra a build com um process.exit(9000)
*/

const fileUtils = require( 'read-file-utils' );
const restClient = require( './sonarRestCalls' );


/**
 * Função que le o log do sonar-scanner e verifica o quality gate correspondente
 * @param {*} sonarqubeHost endereço do servidor do sonar. exemplo: 'http://localhost:9000'
 * @param {*} reportTaskFile caminho do arquivo reportTask gerado pelo sonar-scanner
 */
async function checkQuality ( sonarqubeHost, reportTaskFile, ) {
    /*################################################################################*/
    /*################################# PASSO 1 ######################################*/
    /*################################################################################*/
    let taskIdInputLine = '';
    try {
        taskIdInputLine = await fileUtils.getLineByBegin( reportTaskFile, 'utf-8', 'ceTaskId' );
    } catch ( error ) {
        console.log( `\nErro ao tentar ler o arquivo especificado\n${error}\n\n` );
        process.exit( 8000 );
    }
    let taskId = taskIdInputLine.replace( 'ceTaskId=', '' );



    /*################################################################################*/
    /*################################ PASSO 2 + 3 ###################################*/
    /*################################################################################*/
    let taskRouteUri = `${sonarqubeHost}/api/ce/task?id=${taskId}`;
    let taskResponse = {};
    let taskStatus = '';
    let errorCount = 0;
    while ( taskStatus != 'SUCCESS' ) {
        try {
            taskResponse = await restClient.getStatus( taskRouteUri );
            taskStatus = taskResponse.task.status;
            if ( taskStatus == 'CANCELED' || taskStatus == 'FAILED' ) {
                console.log( `A tarefa de analise nao foi bem sucedida` );
                process.exit( 9000 );
            }
        } catch ( error ) {
            console.log( `\nErro ao enviar um GET ao sonarqube \n${error.message}\n\n` );
            errorCount++;
            if ( errorCount > 10 ) {
                console.log( `Gave up!` );
                process.exit( 9000 );
            }
        }
    }




    /*################################################################################*/
    /*################################# PASSOS 4 #####################################*/
    /*################################################################################*/
    let analysisId = taskResponse.task.analysisId;
    let QualityGateUri = `${sonarqubeHost}/api/qualitygates/project_status?analysisId=${analysisId}`;
    try {
        let qualityStatus = await restClient.getStatus( QualityGateUri );
        if ( qualityStatus.projectStatus.status == 'OK' ) {
            console.log( 'Qualidade aprovada pelo Sonarqube!' );
            process.exit( 0 );
        } else {
            console.log( 'Qualidade reprovada pelo Sonarqube!' );
            console.log( `status do Quality Gate: ${qualityStatus.projectStatus.status}` );
            process.exit( 9000 );
        }
    } catch ( error ) {
        console.log( `\nErro ao enviar um GET ao sonarqube\n${error.message}\n\n` );
        process.exit( 9000 );
    }
}


module.exports = { checkQuality }