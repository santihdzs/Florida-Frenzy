const weeklyMenu = { // menú generado por ChatGPT, completamente ficticio
    lunes: [
        {
            name: "Strawberry Latte",
            image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=700"
        },
        {
            name: "Cat Paw Pancakes",
            image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=700"
        },
        {
            name: "Salmon Toast",
            image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=700"
        }
    ],
    martes: [
        {
            name: "Vanilla Cappuccino",
            image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=700"
        },
        {
            name: "Blueberry Muffin",
            image: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=700"
        },
        {
            name: "Tuna Sandwich",
            image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=700"
        }
    ],
    miercoles: [
        {
            name: "Matcha Milk Tea",
            image: "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=700"
        },
        {
            name: "Cat Face Cookies",
            image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=700"
        },
        {
            name: "Chicken Wrap",
            image: "https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=700"
        }
    ],
    jueves: [
        {
            name: "Caramel Frappe",
            image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=700"
        },
        {
            name: "Cheesecake Slice",
            image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=700"
        },
        {
            name: "Ham Croissant",
            image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=700"
        }
    ],
    viernes: [
        {
            name: "Mocha Coffee",
            image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=700"
        },
        {
            name: "Chocolate Donut",
            image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=700"
        },
        {
            name: "Avocado Toast",
            image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=700"
        }
    ],
    sabado: [
        {
            name: "Iced Rose Latte",
            image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=700"
        },
        {
            name: "Berry Waffles",
            image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=700"
        },
        {
            name: "Club Sandwich",
            image: "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=700"
        }
    ],
    domingo: [
        {
            name: "Hot Chocolate",
            image: "https://images.unsplash.com/photo-1517578239113-b03992dcdd25?w=700"
        },
        {
            name: "Cinnamon Roll",
            image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=700"
        },
        {
            name: "Brunch Omelette",
            image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=700"
        }
    ]
};

function mainDay(day) {
    return day.charAt(0).toUpperCase() + day.slice(1);
}

function getCurrentDay() {
    const days = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
    const todayDate = new Date().getDay();
    return days[todayDate];
}

function loadMenu(day) {
    const menuTitle = document.getElementById("menuTitle");
    const menuList = document.getElementById("menuList");
    const previewImage = document.getElementById("previewImage");
    const previewText = document.getElementById("previewText");

    menuTitle.textContent = `Menú del ${mainDay(day)}`;
    menuList.innerHTML = "";

    const items = weeklyMenu[day];

    if (!items) {
        menuTitle.textContent = "Menú no disponible";
        previewText.textContent = "No hay elementos para mostrar";
        return;
    }

    // default image = first item of the day
    previewImage.src = items[0].image;
    previewText.textContent = items[0].name;

    items.forEach(item => {
        const listItem = document.createElement("list-item");
        listItem.className = "list-group-item cat-card";
        listItem.textContent = item.name;

        listItem.addEventListener("mouseenter", function () {
            previewImage.src = item.image;
            previewText.textContent = item.name;
        });

        menuList.appendChild(listItem);
    });
}

$(document).ready(function () {
    $("main").hide().fadeIn(1000);

    const currentDay = getCurrentDay();
    $("#daySelect").val(currentDay);

    loadMenu(currentDay);

    $("#daySelect").change(function () {
        const selectedDay = $(this).val();
        loadMenu(selectedDay);
        $("#menuList").hide().fadeIn(500);
    });
});