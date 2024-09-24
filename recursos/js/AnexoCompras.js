// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

const _ControlMultiFile = "#formFileMultiple";
let _BtnExport = "#exportBtn";
let _ControlFileName = "#filename";
let _AlertSeccion = "#msjAlert";
let _Disabled = "disabled";

$(document).ready(function () {


    // Evento change del input file para habilitar/deshabilitar el botón de exportar
    $(_ControlMultiFile).change(function () {
        let files = $(this).prop("files");
        if (files.length == 0) {
            $(_BtnExport).prop(_Disabled, true);
        } else {
            $(_BtnExport).prop(_Disabled, false);
        }
    });

    // Evento click del botón exportar
    $(_BtnExport).click(async function () {
        // Deshabilitar el botón mientras se procesa
        $(_BtnExport).prop(_Disabled, true);

        // Limpiar mensajes de alerta previos
        $(_AlertSeccion).empty();

        // Obtener archivos seleccionados
        let files = $(_ControlMultiFile).prop("files");

        // Validar que se haya seleccionado al menos un archivo
        if (files.length == 0) {
            let alerty = AlertDiv("Debe Seleccionar Al menos un Archivo JSON");
            $(_AlertSeccion).append(alerty);
            $(_ControlMultiFile).focus();
            $(_BtnExport).prop(_Disabled, false);
            return;
        }

        // Validar que se haya ingresado un nombre para el archivo
        let filename = $(_ControlFileName).val();
        if (isNullOrEmpty(filename)) {
            let alerty = AlertDiv("Ingrese un nombre para el archivo");
            $(_AlertSeccion).append(alerty);
            $(_BtnExport).prop(_Disabled, false);
            $(_ControlFileName).focus();
            return;
        }

        // Array para almacenar los datos de los archivos JSON
        var ElectronicArray = [];
        try {
            // Leer cada archivo JSON seleccionado y parsearlo
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                let jsonstring = await readFileAsText(file);
                let objjson = JSON.parse(jsonstring);
                ElectronicArray.push(objjson);
            }
        } catch (ex) {
            // Mostrar mensaje de error si ocurre un problema al procesar los archivos JSON
            let alerty = AlertDiv("Los archivos JSON no tienen la estructura esperada. " + ex);
            $(_AlertSeccion).append(alerty);
            $(_BtnExport).prop(_Disabled, false);
            return;
        }

        // Array para almacenar los datos que se convertirán en el archivo Excel
        var excelarray = [];
        for (var i = 0; i < ElectronicArray.length; i++) {
            try {
                var objson = ElectronicArray[i];

                let dteif = objson.identificacion.tipoDte;

                if (dteif == "03" || dteif == "05" || dteif == "06"|| dteif == "11") {

                    let obj = {
                        "FECHA_EMISIÓN": GetDateFormat(objson.identificacion.fecEmi),
                        "CLASE_DOCUMENTO": "4. DOCUMENTO TRIBUTARIO ELECTRONICO (DTE)",
                        // "DTE": objson.identificacion.tipoDte,
                        "TIPO_DOCUMENTO": GetDTE_Anexo_Compras(objson.identificacion.tipoDte),
                        "NUMERO_DE_DOCUMENTO":objson.identificacion.codigoGeneracion.trim(),
                        "NIT_O_NRC_DEL_CLIENTE":objson.receptor.nit || objson.emisor.nrc,
                        "NOMBRE_RAZON_SOCIAL_O_DENOMINACION": objson.emisor.nombre || objson.emisor.nombreComercial,
                        "COMPRAS_INTERNAS_EXENTAS": objson.resumen.totalExenta,
                        "INTERNACIONES_EXENTAS_Y/O_NO_SUJETAS":"0.00",//"No tengo ejemplo JSON 11. FACTURA DE EXPORTACIÓN",
                        "IMPORTACIONES EXENTAS Y/O NO SUJETAS":"0.00",// "No tengo ejemplo JSON 11. FACTURA DE EXPORTACIÓN",
                        "COMPRAS_INTERNAS_GRAVADAS": objson.resumen.totalGravada,
                        "INTERNACIONES_GRAVADAS_DE_BIENES": "0.00",
                        "IMPORTACIONES_GRAVADAS_DE_BIENES": "0.00",
                        "IMPORTACIONES_GRAVADAS_DE_SERVICIOS": "0.00",
                        "CRÉDITO_FISCAL":(objson.resumen?.tributos?.find(tributo => tributo.codigo === "20") || {}).valor || "0",
                        "TOTAL_DE_COMPRAS":objson.resumen.montoTotalOperacion
                    };
                    excelarray.push(obj);
                }


            } catch (ex) {
                // Mostrar mensaje de error si hay un problema con la estructura del JSON
                let alerty = AlertDiv("Los archivos JSON no tienen la estructura esperada. " + ex);
                $(_AlertSeccion).append(alerty);
                $(_BtnExport).prop(_Disabled, false);
                return;
            }
        }

        // Mostrar en consola el JSON que se convertirá a tabla de Excel
        console.log("JSON Tabla de excel");
        console.log(JSON.stringify(excelarray));


        TabularJson(excelarray);




        // Habilitar el botón de exportar y limpiar los campos
        $(_BtnExport).prop(_Disabled, false);
        $(_ControlMultiFile).val(null);
        $(_ControlFileName).val(null);

    });

    function GetSelloRecibido(objson) {
        // Verificar si el propio objeto tiene el atributo selloRecibido
        if (objson.hasOwnProperty('selloRecibido')) {
            return objson.selloRecibido;
        }

        // Buscar el atributo selloRecibido dentro de subobjetos
        for (const key in objson) {
            if (objson[key] && typeof objson[key] === 'object') {
                if (objson[key].hasOwnProperty('selloRecibido')) {
                    return objson[key].selloRecibido;
                }
            }
        }

        // Si no se encuentra, retornar mensaje de no encontrado
        return "No se encontró selloRecibido";
    }


    function GetDesDTE(codigoDTE) {
        switch (codigoDTE) {
            case '01':
                return 'FACTURA';
            case '03':
                return 'COMPROBANTE DE CRÉDITO FISCAL';
            case '04':
                return 'NOTA DE REMISIÓN';
            case '05':
                return 'NOTA DE CRÉDITO';
            case '06':
                return 'NOTA DE DÉBITO';
            case '07':
                return 'COMPROBANTE DE RETENCIÓN';
            case '08':
                return 'COMPROBANTE DE LIQUIDACIÓN';
            case '09':
                return 'DOCUMENTO CONTABLE DE LIQUIDACIÓN';
            case '11':
                return 'FACTURA DE EXPORTACIÓN';
            case '14':
                return 'FACTURA DE SUJETO EXCLUIDO';
            case '15':
                return 'COMPROBANTE DE DONACIÓN';
            default:
                return 'CÓDIGO DTE NO IDENTIFICADO';
        }
    }
// Suponiendo que tienes la fecha en formato yyyy-mm-dd
 function GetDateFormat(inputDate){
// Usamos split para separar año, mes y día
let parts = inputDate.split('-');
// Reorganizamos los valores en el formato dd/mm/yyyy
let formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
return = formattedDate;
 }

    
    function GetDTE_Anexo_Compras(codigoDTE) {
        switch (codigoDTE) {
            case '03':
                return '03. COMPROBANTE DE CRÉDITO FISCAL';
            case '05':
                return '05 NOTA DE CRÉDITO';
            case '06':
                return '06. NOTA DE DÉBITO';
            case '11':
                return '11. FACTURA DE EXPORTACIÓN';
            default:
                return 'CÓDIGO DTE NO IDENTIFICADO';
        }
    }


    // Inicializar los campos y botones al cargar la página
    $(_BtnExport).prop(_Disabled, false);
    $(_ControlMultiFile).val(null);
    $(_ControlFileName).val(null);
});

