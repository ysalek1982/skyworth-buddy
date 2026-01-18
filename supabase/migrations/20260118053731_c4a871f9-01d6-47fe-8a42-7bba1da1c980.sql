-- Add terms and conditions column to landing_settings
ALTER TABLE public.landing_settings 
ADD COLUMN IF NOT EXISTS terms_conditions TEXT DEFAULT '';

-- Set initial terms and conditions HTML content
UPDATE public.landing_settings SET terms_conditions = '
<div class="terms-content">
  <h2>TÉRMINOS Y CONDICIONES DE LA PROMOCIÓN "EL SUEÑO DEL HINCHA SKYWORTH"</h2>
  
  <h3>1. SORTEO DIGITAL</h3>
  <p>El sorteo se realizará el <strong>09 de marzo de 2026</strong>, con la presencia de un Notario de Fe Pública, quien emitirá un acta notariada del sorteo de los 5 paquetes al Partido de Repechaje de la selección Boliviana en <strong>Monterrey – México</strong> el 26 de marzo de 2026.</p>
  
  <p>El sorteo se realizará de manera <strong>DIGITAL</strong>, a través de una computadora que hará correr el sistema con la base de datos a nivel nacional de todos los participantes que hayan realizado su registro de manera correcta hasta el <strong>07 de marzo de 2026 a las 23:59 hrs</strong>. Se utilizará la computadora como una tómbola digital, pasado un determinado tiempo el sistema se irá deteniendo poco a poco hasta parar completamente en uno de los participantes de manera aleatoria y al azar.</p>
  
  <p><em>Ejemplo: Sistema de desarrollo propio de Grupo Empresarial Quisbert, donde se exponen todos los tickets que participan en la base de datos a nivel nacional.</em></p>
  
  <h3>2. MODALIDAD DEL SORTEO</h3>
  <p>La modalidad para el sorteo a realizarse el 09 de marzo de 2026 será: Se elegirán <strong>20 TICKETS</strong> que salgan de manera aleatoria y al azar digitalmente a través de la tómbola digital. Se contactará de manera inmediata a las 20 personas que hayan salido seleccionadas.</p>
  
  <p>Las <strong>5 primeras personas (5 PRIMEROS TICKETS)</strong>, que envíen los requisitos completos para acceder al premio, serán las personas premiadas para asistir al Partido de Repechaje de la selección Boliviana en Monterrey – México el 26 de marzo de 2026.</p>
  
  <p>Los participantes que ya hayan salido elegidos como ganadores en el sorteo, ya no podrán repetir el premio si es que por casualidad o suerte sale nuevamente su nombre como premiado. Inmediatamente queda inhabilitado o será notificado como "al agua".</p>
  
  <h3>3. REQUISITOS OBLIGATORIOS PARA GANADORES</h3>
  <p>Los requisitos que deben presentar obligatoriamente los ganadores del sorteo para acceder al premio o paquete son los siguientes:</p>
  <ul>
    <li>Fotografía anverso y reverso de cédula de identidad boliviano o de extranjero residente en Bolivia vigente</li>
    <li>Fotografía de pasaporte con vigencia de 6 meses para viaje al exterior</li>
    <li>Fotografía del TAG de la póliza de garantía, con el serial del producto ganador</li>
    <li>Fotografía de la póliza de garantía con la cual se registró el producto</li>
    <li>Fotografía de la nota de venta, recibo o factura del equipo adquirido (cualquiera de las 3 indistintamente)</li>
  </ul>
  
  <h3>4. RESPONSABILIDADES, CONDICIONES Y RESTRICCIONES</h3>
  <ol>
    <li>La empresa <strong>Grupo Empresarial Quisbert S.R.L.</strong> es la empresa distribuidora mayorista de la marca Skyworth en Bolivia, comercializando exclusivamente los productos a través de ventas mayoristas y minoristas en mercados y tiendas a nivel nacional.</li>
    <li>Participan en esta promoción solo los productos comercializados por Grupo Empresarial Quisbert S.R.L. que tengan <strong>GARANTÍA VÁLIDA</strong>.</li>
    <li>Grupo Empresarial Quisbert S.R.L., no se hará cargo de ningún gasto incurrido por la persona ganadora del premio o paquete, para acceder al mismo. Por ejemplo si el cliente reside en otra ciudad que no sea Santa Cruz de La Sierra, ciudad de donde saldrá el vuelo, el transporte del ganador va por cuenta propia.</li>
    <li>Los datos personales de los ganadores, deben coincidir necesariamente con el registro de la póliza de garantía y de la factura, nota de venta o recibo del producto adquirido.</li>
    <li>El premio o paquete es <strong>personal e intransferible</strong>, no podrá ser sustituido por otros bienes distintos a los indicados en esta promoción, ni solicitar su valor en efectivo.</li>
    <li>Los Participantes solo podrán inscribir el producto una sola vez, ya que el sistema rechazará automáticamente la inscripción si se trata de participar con el mismo producto por segunda o más veces.</li>
    <li>Con el fin de hacer público el resultado de la promoción, los ganadores autorizan a que sus nombres e imágenes aparezcan en publicaciones y demás medios y en general en todo material de divulgación de las actividades posteriores a la promoción, como entrega y recibo de premios, sin que implique remuneración o compensación adicional reclamos por derecho de imagen.</li>
    <li>El ganador debe ser <strong>mayor de 18 años</strong> y ser ciudadano boliviano o ciudadano extranjero con residencia legal en Bolivia.</li>
    <li>La empresa Grupo Empresarial Quisbert S.R.L., o Skyworth, no responderán por los daños y perjuicios sufridos por los clientes ganadores por el uso de los premios que se entreguen en virtud de la promoción, ocasionados en el disfrute del premio. Se entiende que los clientes ganadores actúan por su propia cuenta y riesgo.</li>
    <li>En caso de pérdida de vuelo por parte del ganador, ni la empresa Grupo Empresarial Quisbert S.R.L., ni Skyworth responderán por lo que se da por sentado la pérdida del premio.</li>
  </ol>
  
  <h4>Condiciones adicionales para ganadores:</h4>
  <ul>
    <li>El ganador debe cumplir con los requerimientos de vacunación exigidos por el país relacionado en el viaje para poder acceder al premio.</li>
    <li>El ganador debe cumplir con los requisitos de los eventos y/o locaciones que visiten durante el programa: Uso adecuado del tapabocas, distanciamiento social y/o presentación de certificado de vacunación en caso de que aplique.</li>
  </ul>
  
  <h3>5. LUGAR Y FECHA DEL SORTEO</h3>
  <p>El sorteo se realizará el <strong>09 de marzo de 2026</strong>, con la presencia de un Notario de Fe Pública, en las oficinas del Grupo Empresarial Quisbert S.R.L., ubicada en la <strong>Av. Viedma Nro. 687 – Santa Cruz Bolivia</strong>.</p>
  
  <h3>6. LUGAR Y FECHA DE ENTREGA DE PREMIOS</h3>
  <p>La entrega de premios se realizará el <strong>16 de marzo de 2026</strong> en presencia de Notario de Fe Pública en Av. Viedma Nro. 687 Santa Cruz de la Sierra, Bolivia.</p>
  <p>No se necesitará la presencia de los ganadores toda vez que la asignación de boletos aéreos y reservas de hoteles son digitales enviadas al número de celular y/o correo electrónico indicado por los ganadores.</p>
  
  <h3>7. PARTICIPACIÓN DE VENDEDORES</h3>
  <p>Podrán participar los vendedores de las tiendas mayoristas y distribuidoras de mercados y tiendas a nivel nacional que realicen ventas de televisores de la marca Skyworth.</p>
  
  <h4>Productos participantes:</h4>
  <table>
    <thead>
      <tr><th>MODELO</th><th>DESCRIPCIÓN</th><th>PUNTOS</th></tr>
    </thead>
    <tbody>
      <tr><td>Q7500G</td><td>65" 75"</td><td>4</td></tr>
      <tr><td>Q7700G</td><td>86"</td><td>4</td></tr>
      <tr><td>Q7800G</td><td>100"</td><td>4</td></tr>
      <tr><td>Q6600H</td><td>55" 60" 65" 75"</td><td>3</td></tr>
      <tr><td>G6600H / G6600G</td><td>55" 60" 65" 75"</td><td>3</td></tr>
      <tr><td>G6600H / G6600G</td><td>50"</td><td>2</td></tr>
      <tr><td>E6600H</td><td>32" 43"</td><td>2</td></tr>
      <tr><td>E5500H / E5500G</td><td>40"</td><td>2</td></tr>
      <tr><td>E5500H / E5500G</td><td>32" 43"</td><td>1</td></tr>
    </tbody>
  </table>
  
  <p>Los <strong>6 vendedores</strong> con mayor cantidad de puntos, serán los ganadores de paquetes para asistir al Partido de Repechaje de la selección Boliviana en Monterrey – México – Mundial 2026.</p>
  <p>El 09 de marzo de 2026, se elegirán 6 ganadores (vendedores) por ciudad: <strong>2 ganadores para La Paz – 2 ganadores para Cochabamba – 2 ganadores para Santa Cruz</strong>.</p>
  
  <h3>8. PREMIOS OFERTADOS</h3>
  <p>Se otorgarán <strong>11 paquetes</strong> para asistir al Partido de Repechaje de la selección Boliviana en Monterrey – México – Mundial 2026, con el siguiente detalle:</p>
  <ul>
    <li>Boleto aéreo Santa Cruz/Monterrey/Santa Cruz</li>
    <li>7 noches de Hospedaje (Desayuno Incluido)</li>
    <li>Traslado Aeropuerto Monterrey - Hotel – Aeropuerto Monterrey</li>
    <li>Ingreso Partido Semifinal 26 de marzo de 2026</li>
    <li>Entrada partido Final 31 de marzo de 2026 (en caso que Bolivia gane)</li>
  </ul>
  
  <p><strong>Nota:</strong> Cada ganador podrá llevarse 1 paquete de viaje. Los premios o paquetes no incluyen ninguna otra prestación, bien o servicio no enumerado o especificado en este documento.</p>
</div>
' WHERE is_active = true;