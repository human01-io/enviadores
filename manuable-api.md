---
title: manuable-api
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# manuable-api

Base URLs:

* <a href="https://test.your-api-server.com">Testing Env: https://test.your-api-server.com</a>

# Authentication

- HTTP Authentication, scheme: bearer

# Endpoints/Usuario

<a id="opIdManuableApi.Controllers.V1.SessionController.create"></a>

## POST Inicio de Sesión

POST /api/session

Este endpoint permite autenticar al usuario mediante su correo electrónico y contraseña. Si las credenciales proporcionadas son válidas, se devuelve un token de autenticación que puede ser utilizado para acceder a los endpoints protegidos de la API.

> Body Parameters

```json
{
  "email": "god_admin@example.com",
  "password": "password123"
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|body|body|[Inicio de sesión](#schemainicio de sesión)| no | Login|none|

> Response Examples

> 201 Response

```json
{
  "email": "manuable@manuable.com",
  "token": "token",
  "uuid": "IDENTIFICADOR_UNICO_DE_LA_CUENTA"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|La respuesta incluye los datos fundamentales de la cuenta, como el identificador, el correo electrónico asociado y el token de acceso.|[LoginResponse](#schemaloginresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|NO CUENTA CON LOS PERMISOS NECESARIOS (REVISA TU TOKEN)|[Unauthorized](#schemaunauthorized)|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|BAD REQUEST PARAMS|[BadRequest](#schemabadrequest)|

## GET Consulta Saldo

GET /api/accounts/balance

Este endpoint permite consultar el saldo disponible asociado a la cuenta del usuario. La solicitud debe incluir un token de autenticación válido en los encabezados para su validación.

> Response Examples

> 200 Response

```json
{
  "total": "15000.00"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» total|string|true|none||none|

# Endpoints/Cotización

<a id="opIdManuableApi.V1.RatesController.create"></a>

## POST Obtener cotizacion

POST /api/rates

Las cotizaciones retornadas están limitadas a los servicios de paquetería habilitados en tu cuenta.

> Body Parameters

```json
{
  "address_from": {
    "country_code": "MX",
    "zip_code": "54040"
  },
  "address_to": {
    "country_code": "MX",
    "zip_code": "54040"
  },
  "parcel": {
    "currency": "MXN",
    "distance_unit": "CM",
    "height": 10,
    "length": 10,
    "mass_unit": "KG",
    "weight": 1,
    "width": 10
  }
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|body|body|[Request para cotización](#schemarequest para cotización)| no | RateRequest|none|

> Response Examples

> 201 Response

```json
{
  "data": [
    {
      "additional_fees": [],
      "carrier": "FEDEX",
      "currency": "MXN",
      "service": "standard",
      "shipping_type": "local",
      "total_amount": "400.0",
      "uuid": "9964cf5d-b248-4d26-bdd6-586c43ea8e01",
      "zone": 2
    },
    {
      "additional_fees": [],
      "carrier": "FEDEX",
      "currency": "MXN",
      "service": "express",
      "shipping_type": "local",
      "total_amount": "400.0",
      "uuid": "587ca7c9-e16a-4ddb-9e1b-0e01a86ee322",
      "zone": 2
    }
  ]
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|201|[Created](https://tools.ietf.org/html/rfc7231#section-6.3.2)|Muestra las tarifas calculadas en función de los parámetros proporcionados.|[RateResponse](#schemarateresponse)|
|403|[Forbidden](https://tools.ietf.org/html/rfc7231#section-6.5.3)|BAD REQUEST PARAMS|[Unauthorized](#schemaunauthorized)|
|422|[Unprocessable Entity](https://tools.ietf.org/html/rfc2518#section-10.3)|BAD REQUEST PARAMS|[BadRequest](#schemabadrequest)|

# Endpoints/Guías

## POST Emisión de Guía

POST /api/labels

Este endpoint permite generar una guía de envío, proporcionando los datos de origen, destino e información adicional del paquete. La emisión requiere un token de autenticación válido y el identificador (UUID) de la cotización previamente obtenida.

> Body Parameters

```json
{
  "address_from": {
    "name": "Fulanito Juarez",
    "street1": "Mercedes",
    "neighborhood": "Barrio Guadalupe",
    "external_number": "243",
    "city": "Iztapalapa",
    "state": "CDMX",
    "phone": "5518426237",
    "email": "example@example.com",
    "country": "MEXICO",
    "country_code": "MX",
    "reference": "Enfrente de un oxxo"
  },
  "address_to": {
    "name": "Fulanito Juarez",
    "street1": "Mercedes",
    "neighborhood": "Barrio Guadalupe",
    "external_number": "243",
    "city": "Iztapalapa",
    "state": "CDMX",
    "phone": "5518426237",
    "email": "example@example.com",
    "country": "MEXICO",
    "country_code": "MX",
    "reference": "Enfrente de un oxxo"
  },
  "parcel": {
    "currency": "MXN",
    "product_id": "01010101",
    "product_value": 4324,
    "quantity_products": 1,
    "content": "GIFT"
  },
  "label_format": "THERMAL",
  "rate_token": "RATE_UUID"
}
```

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|body|body|object| no ||none|
|» address_from|body|[Address_for_label](#schemaaddress_for_label)| yes | Address Copy|Dirección del remitente|
|»» name|body|string| yes ||Nombre de la persona|
|»» street1|body|string| yes ||Calle de la casa|
|»» neighborhood|body|string| yes ||Vecindario/colonia|
|»» external_number|body|string| yes ||No. exterior de la casa|
|»» city|body|string| yes ||Ciudad/Delegacion|
|»» state|body|string| yes ||Estado|
|»» phone|body|string| yes ||Número de teléfono en caso de requerir contacto|
|»» email|body|string| yes ||Dirección de correo electrónico|
|»» country|body|string| yes ||Pais|
|»» country_code|body|string| yes ||Código de país (Mexico -> MX)|
|»» reference|body|string| no ||Referencias de la casa origen/destino, ej. "Enfrente de un oxxo"|
|» address_to|body|[Address_for_label](#schemaaddress_for_label)| yes | Address Copy|Dirección del remitente|
|»» name|body|string| yes ||Nombre de la persona|
|»» street1|body|string| yes ||Calle de la casa|
|»» neighborhood|body|string| yes ||Vecindario/colonia|
|»» external_number|body|string| yes ||No. exterior de la casa|
|»» city|body|string| yes ||Ciudad/Delegacion|
|»» state|body|string| yes ||Estado|
|»» phone|body|string| yes ||Número de teléfono en caso de requerir contacto|
|»» email|body|string| yes ||Dirección de correo electrónico|
|»» country|body|string| yes ||Pais|
|»» country_code|body|string| yes ||Código de país (Mexico -> MX)|
|»» reference|body|string| no ||Referencias de la casa origen/destino, ej. "Enfrente de un oxxo"|
|» parcel|body|object| yes ||Datos del paquete a enviar (se emite con las medidas puestas en la cotización)|
|»» currency|body|string| yes ||Moneda del valor del producto|
|»» distance_unit|body|string| yes ||Unidad de medida de distancia|
|»» mass_unit|body|string| yes ||Unidad de medida de peso|
|»» product_id|body|string| yes ||ID del producto|
|»» product_value|body|number| yes ||Valor del producto (valor mínimo de 1)|
|»» quantity_products|body|integer| yes ||Cantidad de productos|
|»» content|body|string| yes ||Contenido|
|» rate_token|body|string| yes ||UUID de la cotización a elegir|
|» label_format|body|string| no ||Formato de impresión (PDF/THERMAL) por defecto PDF|

> Response Examples

> 200 Response

```json
{
  "token": "82d9a-4490-bf73-1244e00608a5",
  "created_at": "2024-11-04T18:12:45",
  "tracking_number": "794809162",
  "label_url": "http://static.example.com/uploa48299245754-DdcfIeguBdfY38OF0Gw.pdf",
  "price": "100"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» token|string|true|none||none|
|» created_at|string|true|none||none|
|» tracking_number|string|true|none||none|
|» label_url|string|true|none||none|
|» price|string|true|none||none|

## GET Historial de guías

GET /api/labels

Este endpoint devuelve un listado paginado de las guías de envío generadas asociadas a tu cuenta. La respuesta se organiza en grupos de 30 elementos por página.. Permite aplicar filtro de búsqueda para buscar una guía específica por número de rastreo (tracking_number). Se requiere un token de autenticación válido enviado en los encabezados de la solicitud.

### Params

|Name|Location|Type|Required|Title|Description|
|---|---|---|---|---|---|
|tracking_number|query|string| no ||Número de rastreo especifico a buscar|
|page|query|string| no ||Página especifica a buscar|

> Response Examples

> 200 Response

```json
"{\n    \"data\": [\n        {\n            \"token\": \"82d9a-4490-bf73-1244e00608a5\",\n            \"created_at\": \"2024-11-04T18:12:45\",\n            \"tracking_number\": \"794809162\",\n            \"label_url\": \"http://static.example.com/uploa48299245754-DdcfIeguBdfY38OF0Gw.pdf\",\n            \"price\": \"100\"\n        },\n        {\n            \"token\": \"56dkq-44xd-1233-1hf065608a5\",\n            \"created_at\": \"2024-11-26T18:13:23\",\n            \"tracking_number\": \"794809342\",\n            \"label_url\": \"http://static.example.com/uploa48299245754-DdcfIeguBdfY38OF0Gw.pdf\",\n            \"price\": \"100\"\n        }...\n    ]\n}"
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» data|[object]|true|none||none|
|»» token|string|true|none||UUID del label|
|»» tracking_number|string|true|none||Número de tracking|
|»» price|string|true|none||Costo de la guia|
|»» label_url|string|true|none||URL|
|»» created_at|string|true|none||Fecha de creación|

# Data Schema

<h2 id="tocS_Address_for_label">Address_for_label</h2>

<a id="schemaaddress_for_label"></a>
<a id="schema_Address_for_label"></a>
<a id="tocSaddress_for_label"></a>
<a id="tocsaddress_for_label"></a>

```json
{
  "country_code": "MX",
  "zip_code": "66058"
}

```

Address Copy

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|name|string|true|none||Nombre de la persona|
|street1|string|true|none||Calle de la casa|
|neighborhood|string|true|none||Vecindario/colonia|
|external_number|string|true|none||No. exterior de la casa|
|city|string|true|none||Ciudad/Delegacion|
|state|string|true|none||Estado|
|phone|string|true|none||Número de teléfono en caso de requerir contacto|
|email|string|true|none||Dirección de correo electrónico|
|country|string|true|none||Pais|
|country_code|string|true|none||Código de país (Mexico -> MX)|
|reference|string|false|none||Referencias de la casa origen/destino, ej. "Enfrente de un oxxo"|

<h2 id="tocS_Account">Account</h2>

<a id="schemaaccount"></a>
<a id="schema_Account"></a>
<a id="tocSaccount"></a>
<a id="tocsaccount"></a>

```json
{
  "balance": 10,
  "custom_permissions": {},
  "email": "manuable@manuable.com",
  "name": "John Doe",
  "organization_id": "ORGANIZATION_ID_YOU'RE_ASSOCIATED_WITH",
  "package_fees_ids": [
    "PACKAGE_FEE_UUID",
    "PACKAGE_FEE_UUID",
    "PACKAGE_FEE_UUID"
  ],
  "password": "12345678",
  "role_id": "ROLE_ID_OF_YOUR_USER"
}

```

Account

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|balance|number(float)|false|none||Saldo de la cuenta|
|custom_permissions|object|false|none||Permisos personalizados del usuario|
|email|string|true|none||Correo electrónico|
|encrypted_password|string|false|none||Contraseña encriptada de la cuenta|
|name|string|true|none||Nombre de la cuenta|
|organization|object|false|none||Organización asociada|
|organization_id|integer|true|none||ID de la organización asociada|
|package_fees|[object]|false|none||Todos los paquetes de Tarifas asociadas a la cuenta|
|package_fees_ids|[integer]|false|none||IDs de los paquetes de Tarifas asociadas a la cuenta|
|password|string(password)|true|none||Contraseña de la cuenta|
|role|object|false|none||Rol asociado|
|role_id|integer|false|none||ID del rol asociado|
|uuid|string|false|none||Identificador único de la cuenta|

<h2 id="tocS_BadRequest">BadRequest</h2>

<a id="schemabadrequest"></a>
<a id="schema_BadRequest"></a>
<a id="tocSbadrequest"></a>
<a id="tocsbadrequest"></a>

```json
{
  "errors": [
    {
      "message": "missing field",
      "source": {
        "pointer": "/email"
      },
      "title": "invalid value"
    }
  ]
}

```

BadRequest

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|errors|[object]|true|none||none|
|» message|string|false|none||none|
|» source|object|true|none||none|
|»» pointer|string|true|none||none|
|» title|string|true|none||none|

<h2 id="tocS_Inicio de sesión">Inicio de sesión</h2>

<a id="schemainicio de sesión"></a>
<a id="schema_Inicio de sesión"></a>
<a id="tocSinicio de sesión"></a>
<a id="tocsinicio de sesión"></a>

```json
{
  "email": "god_admin@example.com",
  "password": "password123"
}

```

Login

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|email|string|true|none||Correo electrónico|
|password|string(password)|true|none||Contraseña de la cuenta|

<h2 id="tocS_LoginResponse">LoginResponse</h2>

<a id="schemaloginresponse"></a>
<a id="schema_LoginResponse"></a>
<a id="tocSloginresponse"></a>
<a id="tocsloginresponse"></a>

```json
{
  "email": "manuable@manuable.com",
  "token": "token",
  "uuid": "IDENTIFICADOR_UNICO_DE_LA_CUENTA"
}

```

LoginResponse

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|id|string|false|none||UUID de la cuenta|
|token|string|false|none||Token|
|email|string|false|none||Correo de la cuenta|

<h2 id="tocS_Unauthorized">Unauthorized</h2>

<a id="schemaunauthorized"></a>
<a id="schema_Unauthorized"></a>
<a id="tocSunauthorized"></a>
<a id="tocsunauthorized"></a>

```json
{
  "error": "Unauthenticated"
}

```

Unauthorized

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|error|string|false|none||Mensaje de error|

<h2 id="tocS_package_fees">package_fees</h2>

<a id="schemapackage_fees"></a>
<a id="schema_package_fees"></a>
<a id="tocSpackage_fees"></a>
<a id="tocspackage_fees"></a>

```json
[
  {}
]

```

package_fees

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|package_fees|[object]|false|none|package_fees|none|

<h2 id="tocS_status">status</h2>

<a id="schemastatus"></a>
<a id="schema_status"></a>
<a id="tocSstatus"></a>
<a id="tocsstatus"></a>

```json
{
  "message": "meta rates updated"
}

```

status

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|message|string|false|none||none|

<h2 id="tocS_Address">Address</h2>

<a id="schemaaddress"></a>
<a id="schema_Address"></a>
<a id="tocSaddress"></a>
<a id="tocsaddress"></a>

```json
{
  "country_code": "MX",
  "zip_code": "66058"
}

```

Address

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|country_code|string|false|none||Código de país|
|zip_code|string|false|none||Código postal|

<h2 id="tocS_Parcel">Parcel</h2>

<a id="schemaparcel"></a>
<a id="schema_Parcel"></a>
<a id="tocSparcel"></a>
<a id="tocsparcel"></a>

```json
{
  "currency": "MXN",
  "distance_unit": "CM",
  "height": 10,
  "length": 10,
  "mass_unit": "KG",
  "product_id": "01010101",
  "product_value": 4321,
  "quantity_products": 1,
  "reason_code": "GIFT",
  "weight": 10,
  "width": 10
}

```

Parcel

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|currency|string|true|none||Moneda del valor del producto|
|distance_unit|string|true|none||Unidad de medida de distancia|
|height|number|true|none||Alto del paquete|
|length|number|true|none||Largo del paquete|
|mass_unit|string|true|none||Unidad de medida de peso|
|product_id|string|true|none||ID del producto|
|product_value|number|true|none||Valor del producto (valor mínimo de 1)|
|quantity_products|integer|true|none||Cantidad de productos|
|content|string|true|none||Contenido|
|weight|number|true|none||Peso del paquete|
|width|number|true|none||Ancho del paquete|

<h2 id="tocS_QuoteRequest">QuoteRequest</h2>

<a id="schemaquoterequest"></a>
<a id="schema_QuoteRequest"></a>
<a id="tocSquoterequest"></a>
<a id="tocsquoterequest"></a>

```json
{
  "address_from": {
    "country_code": "MX",
    "zip_code": "66058"
  },
  "address_to": {
    "country_code": "MX",
    "zip_code": "66058"
  },
  "parcel": {
    "currency": "MXN",
    "distance_unit": "CM",
    "height": 10,
    "length": 10,
    "mass_unit": "KG",
    "product_id": "YU542",
    "product_value": 4321,
    "quantity_products": 1,
    "reason_code": "GIFT",
    "weight": 10,
    "width": 10
  }
}

```

QuoteRequest

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|address_from|[Address](#schemaaddress)|true|none||Esquema de una dirección|
|address_to|[Address](#schemaaddress)|true|none||Esquema de una dirección|
|parcel|[Parcel](#schemaparcel)|true|none||Esquema de un paquete|

<h2 id="tocS_Rate">Rate</h2>

<a id="schemarate"></a>
<a id="schema_Rate"></a>
<a id="tocSrate"></a>
<a id="tocsrate"></a>

```json
{
  "additional_fees": [],
  "carrier": "FEDEX",
  "currency": "MXN",
  "service": "standard",
  "shipping_type": "local",
  "total_amount": "400.0",
  "uuid": "9964cf5d-b248-4d26-bdd6-586c43ea8e01",
  "zone": 2
}

```

Rate

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|additional_fees|[object]|false|none||Cargos adicionales|
|carrier|string|false|none||Compañía de envíos|
|currency|string|false|none||Moneda del valor del producto|
|service|integer|false|none||Servicio de envío|
|shipping_type|number|false|none||Tipo de envío|
|total_amount|string|false|none||Precio total de envío|
|uuid|object|false|none||Identificador único de la cotización|
|weight|number|false|none||Peso del paquete|
|zone|integer|false|none||Zona de envío|

<h2 id="tocS_Request para cotización">Request para cotización</h2>

<a id="schemarequest para cotización"></a>
<a id="schema_Request para cotización"></a>
<a id="tocSrequest para cotización"></a>
<a id="tocsrequest para cotización"></a>

```json
{
  "address_from": {
    "country_code": "MX",
    "zip_code": "66058"
  },
  "address_to": {
    "country_code": "MX",
    "zip_code": "66058"
  },
  "parcel": {
    "currency": "MXN",
    "distance_unit": "CM",
    "height": 10,
    "length": 10,
    "mass_unit": "KG",
    "product_id": "YU542",
    "product_value": 4321,
    "quantity_products": 1,
    "reason_code": "GIFT",
    "weight": 4,
    "width": 10
  }
}

```

RateRequest

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|address_from|[Address](#schemaaddress)|true|none||Esquema de una dirección|
|address_to|[Address](#schemaaddress)|true|none||Esquema de una dirección|
|parcel|[Parcel](#schemaparcel)|true|none||Esquema de un paquete|

<h2 id="tocS_RateResponse">RateResponse</h2>

<a id="schemarateresponse"></a>
<a id="schema_RateResponse"></a>
<a id="tocSrateresponse"></a>
<a id="tocsrateresponse"></a>

```json
{
  "data": [
    {
      "additional_fees": [],
      "carrier": "FEDEX",
      "currency": "MXN",
      "service": "standard",
      "shipping_type": "local",
      "total_amount": "400.0",
      "uuid": "9964cf5d-b248-4d26-bdd6-586c43ea8e01",
      "zone": 2
    },
    {
      "additional_fees": [],
      "carrier": "FEDEX",
      "currency": "MXN",
      "service": "express",
      "shipping_type": "local",
      "total_amount": "400.0",
      "uuid": "587ca7c9-e16a-4ddb-9e1b-0e01a86ee322",
      "zone": 2
    }
  ]
}

```

RateResponse

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|data|[[Rate](#schemarate)]|false|none||Lista de cotizaciones|

