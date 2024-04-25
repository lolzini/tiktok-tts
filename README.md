# Tiktok TTS

Esta es una herramienta que nos ayuda a conectar a un chat LIVE de TikTok y nos puede generar audios de los mensajes enviados.

Para usarlo correctamente debes cambiar `tiktokUsername` al nombre de usuario correspondiente.

Para generar los audios hay dos alternativas, la alternativa por defecto es usando Azure.

Si quieres cambiar a Google Cloud, deberás importar `synthGoogleAudio` en lugar de `synthAzureAudio`.

Usa Azure Speech Services para generar los audios y los guarda dentro de la misma carpeta.

Usa `VLC Player` para reproducir los audios generados.

Borra los audios después de 10 segundos de reproducirlos.

Agrega un audio llamado `nuevo-regalo.wav` para conectar los eventos de `gift` del chat.

## Alternativas

### Usando Microsoft Azure

Debes agregar `KEY` y `REGION` a un archivo `.env` con los datos de tu cuenta de Microsoft Azure Speech Services.

### Usando Google Cloud

Debes usar el `sdk` de Google para usar correctamente la versión de síntesis de audio.
