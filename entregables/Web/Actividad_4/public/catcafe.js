function capitalizeDay(day) { // Función para capitalizar el nombre del día (por ejemplo, "monday" a "Monday")
    return day.charAt(0).toUpperCase() + day.slice(1);
}

function getCurrentDay() {
    const days = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    return days[new Date().getDay()]; // Obtener el día actual como un número (0-6) y devolver el nombre correspondiente
}

async function loadMenu(day) {
    const menuTitle = document.getElementById("menuTitle");
    const menuList = document.getElementById("menuList");
    const previewImage = document.getElementById("previewImage");
    const previewText = document.getElementById("previewText");

    menuTitle.textContent = `Menú del ${capitalizeDay(day)}`; // Actualizar el título del menú con el día capitalizado
    menuList.innerHTML = ""; // Limpiar el menú antes de cargar los nuevos elementos

    try {
        const response = await fetch(`/api/menu/${day}`); // Hacer una solicitud al backend para obtener el menú del día
        const items = await response.json(); // Convertir la respuesta a JSON

        if (!items.length) { // Si no hay elementos en el menú, mostrar un mensaje de que el menú no está disponible
            menuTitle.textContent = "Menú no disponible";
            previewText.textContent = "No hay elementos para mostrar.";
            return;
        }

        previewImage.src = items[0].image_url; // Mostrar la imagen del primer elemento del menú como vista previa
        previewText.textContent = `${items[0].item_name}: ${items[0].item_description || ''}`; // Mostrar el nombre y descripción del primer elemento del menú como vista previa

        items.forEach(item => {
            const li = document.createElement("li"); // Crear un nuevo elemento de lista para cada elemento del menú
            li.className = "list-group-item"; // Agregar la clase de Bootstrap para estilos
            li.innerHTML = `<strong>${item.item_name}</strong><br><small>${item.item_description || ""}</small>`; 

            li.addEventListener("mouseenter", function () {
                previewImage.src = item.image_url;
                previewText.textContent = `${item.item_name}: ${item.item_description || ''}`;
            }); // Agregar un evento para mostrar la vista previa al pasar el mouse sobre el elemento del menú

            menuList.appendChild(li); // Agregar el elemento de lista al menú
        });
    }

    catch (error) {
        console.error("Error al cargar el menú:", error);
        menuTitle.textContent = "Error al cargar el menú";
        previewText.textContent = "No se pudo obtener la información del menú.";
    }
}

function createCatCard(cat) {
  return `
    <div class="col-md-6 col-lg-4">
      <div class="card h-100 cat-card">
        <a href="${cat.instagram_post_url}" target="_blank">
          <img src="${cat.image_url}" class="card-img-top" alt="${cat.cat_name}">
        </a>
        <div class="card-body">
          <h5 class="card-title"><strong>${cat.cat_name}</strong></h5>
          <p class="card-text"><strong>Edad:</strong> ${cat.age_label || 'No especificada'}</p>
          <p class="card-text"><strong>Carácter:</strong> ${cat.personality || 'No especificado'}</p>
          <p class="card-text"><strong>Historia:</strong> ${cat.story || 'Sin historia registrada.'}</p>
          <p class="card-text"><strong>Estatus:</strong> ${cat.adoption_status || 'Disponible'}</p>
        </div>
      </div>
    </div>
  `;
}

async function loadCats() { // Función para cargar la lista de gatos desde el backend y mostrarla en la página
  const catsContainer = document.getElementById("catsContainer");

  try {
    const response = await fetch("/api/cats");
    const cats = await response.json();

    catsContainer.innerHTML = "";

    cats.forEach(cat => {
      catsContainer.innerHTML += createCatCard(cat);
    });
  } 
  
  catch (error) {
    console.error("Error cargando gatos:", error);
    catsContainer.innerHTML = `<p>No se pudieron cargar los gatos.</p>`;
  }
}

// Código para manejar la interacción con el DOM y cargar los datos al iniciar la página
$(document).ready(function () {
    $("main").hide().fadeIn(1000); // Agregar un efecto de fade-in al cargar la página para una mejor experiencia visual

    // Establecer el día actual como el valor seleccionado en el dropdown al cargar la página
    const currentDay = getCurrentDay();
    $("#daySelect").val(currentDay); 

    loadMenu(currentDay);
    loadCats();

    $("#daySelect").change(function () {
        const selectedDay = $(this).val(); // Obtener el día seleccionado del dropdown
        loadMenu(selectedDay);
        $("#menuList").hide().fadeIn(500); // Agregar un efecto de fade-in al actualizar el menú para una mejor experiencia visual
    });
});