﻿// Please see documentation at https://learn.microsoft.com/aspnet/core/client-side/bundling-and-minification
// for details on configuring this project to bundle and minify static web assets.

// Write your JavaScript code.

const _ControlMultiFile ="#formFileMultiple";
let _BtnExport ="#exportBtn";
let _ControlFileName ="#filename";
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

                let dteif= objson.identificacion.tipoDte;

                if (dteif == "03" ||    dteif == "05" ||  dteif == "06"){

                    let obj = {
                        "FECHA_EMISIÓN": GetDateFormat(objson.identificacion.fecEmi),
                        "CLASE_DOCUMENTO": "4. DOCUMENTO TRIBUTARIO ELECTRONICO (DTE)",
                        "TIPO_DOCUMENTO": GetDTE_Anexo_Contribuyente(objson.identificacion.tipoDte),
                        "NUMERO_DE_RESOLUCION(CodGeneracion)":objson.identificacion.codigoGeneracion.trim(),
                        "SERIE_DEL_DOCUMENTO(SelloRecibido)": GetSelloRecibido(objson),
                        "NUMERO_DE_DOCUMENTO(CodControl)":objson.identificacion.numeroControl.trim(),
                        "NUMERO_DE_CONTROL_INTERNO": "",
                        // "NUMERO_DE_CONTROL_INTERNO": objson.identificacion.tipoDte,
                        "NIT_O_NRC_DEL_CLIENTE":objson.receptor.nit || objson.receptor.nrc,
                        "NOMBRE_RAZON_SOCIAL_O_DENOMINACION":objson.receptor.nombre || objson.receptor.nombreComercial,
                        "VENTAS_EXENTAS": objson.resumen.totalExenta,
                        "VENTAS_NO_SUJETAS": objson.resumen.totalNoSuj,
                        "VENTAS_GRAVADAS_LOCALES": objson.resumen.totalGravada,
                        "DEBITO_FISCAL(IVA)": (objson.resumen?.tributos?.find(tributo => tributo.codigo === "20") || {}).valor || "0",
                        "VENTAS_TERCEROS_NO_DOMICILIADOS":"0.00",
                        "DEBITO FISCAL POR VENTAS A CUENTA DE TERCEROS": "0.00",
                        "TOTAL_DE_VENTAS":objson.resumen.montoTotalOperacion,
                        "NUMERO_DE_DUI_DEL_CLIENTE": "",
                        // "TIPO DE OPERACIÓN (Renta)": objson.identificacion.tipoOperacion,
                        // "TIPO DE INGRESO (Renta)": objson.cuerpoDocumento[0].tipoItem,

                        "TIPO DE OPERACIÓN (Renta)": "",
                        "TIPO DE INGRESO (Renta)": "",
                        "NUMERO_DE_ANEXO": "",
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

    // Suponiendo que tienes la fecha en formato yyyy-mm-dd
 function GetDateFormat(inputDate){
    // Usamos split para separar año, mes y día
    let parts = inputDate.split('-');
    // Reorganizamos los valores en el formato dd/mm/yyyy
    let formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    return formattedDate;
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


function GetDTE_Anexo_Contribuyente(codigoDTE) {
    switch (codigoDTE) {
        case '03':
            return '03. COMPROBANTE DE CRÉDITO FISCAL';
        case '05':
            return '05 NOTA DE CRÉDITO';
        case '06':
            return '06. NOTA DE DÉBITO';
        default:
            return 'CÓDIGO DTE NO IDENTIFICADO';
    }
}
    

    // Inicializar los campos y botones al cargar la página
    $(_BtnExport).prop(_Disabled, false);
    $(_ControlMultiFile).val(null);
    $(_ControlFileName).val(null);
});

