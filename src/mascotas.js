document.getElementById("registerPet-form").addEventListener("submit", async(e) => {
    e.preventDefault();
    //console.log(e.target.children.name.value);
    const res = await fetch("http://localhost:3000/mascotas", {
        method: "POST",
        headers:{
            "Content-Type" : "application/json"
        },
        body: JSON.stringify({
            name: e.target.children.name.value,
            race: e.target.children.race.value,
            birthDate: e.target.children.birthDate.value,
            weight: e.target.children.weight.value,
            species: e.target.children.species.value,
            sex: e.target.children.sex.value,
            food: e.target.children.food.value,
            vaccination: e.target.children.vaccination.value,
            deworming: e.target.children.deworming.value,
            livingPlace: e.target.children.livingPlace.value,
            allergies: e.target.children.allergies.value,
            which: e.target.children.which.value
        })
    });
    if(!res.ok) return;
    const resJson = await res.json();
    if(resJson.redirect){
        window.location.href = resJson.redirect;
    }
})