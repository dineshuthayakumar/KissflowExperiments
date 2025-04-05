let kf;
window.onload = async function () {
    kf = await window.kf.initialize();
};
let capacityData = [];
let taskData = [];

// Helper to generate the text below each bar.
function generateText(availableHours, allocatedHours) {
    return `(${allocatedHours} of ${availableHours} h)`;
}

// Compute the scaling factor based on the maximum allocatedHours in the data.
function computeScale(data) {
    const maxAllocated = Math.max(...data.map(item => item.allocatedHours));
    // Avoid division by zero if all allocatedHours are zero.
    return maxAllocated > 0 ? 300 / maxAllocated : 1;
}

// Determine the bar color based on available vs. allocated hours.
function determineBarColor(availableHours, allocatedHours) {
    return allocatedHours <= availableHours ? "green" : "red";
}

// Compute the inner bar width percentage.
function computeBarWidth(availableHours, allocatedHours) {
    // If no available hours, return 0%.
    if (availableHours === 0 || allocatedHours === 0) return "0%";
    if (allocatedHours < availableHours) {
        return (allocatedHours / availableHours * 100) + "%";
    } else {
        return (availableHours / allocatedHours * 100) + "%";
    }
}

// Function to render capacity bars dynamically.
function renderCapacityBars(data) {
    const container = document.getElementById("capacity-container");
    container.innerHTML = ""; // Clear any existing content

    // Compute the scaling factor for container widths.
    const scale = computeScale(data);

    data.forEach(item => {
        // Create label element.
        const labelDiv = document.createElement("div");
        labelDiv.className = "capacity-label";
        labelDiv.textContent = item.label;
        container.appendChild(labelDiv);

        // Compute dynamic container width: allocatedHours * scale px.
        const computedContainerWidth = (item.allocatedHours * scale) + "px";

        // Create the capacity bar container.
        const barContainer = document.createElement("div");
        barContainer.className = "capacity-bar-container" + (item.allocatedHours >= item.availableHours ? " red" : "");
        barContainer.style.width = computedContainerWidth;

        // Determine bar color based on available and allocated hours.
        const computedBarColor = determineBarColor(item.availableHours, item.allocatedHours);
        // Compute inner bar width percentage.
        const computedBarWidth = computeBarWidth(item.availableHours, item.allocatedHours);

        // Create the inner capacity bar element.
        const barDiv = document.createElement("div");
        barDiv.className = "capacity-bar " + computedBarColor;
        barDiv.style.width = computedBarWidth;
        barContainer.appendChild(barDiv);

        // Create the black marker element.
        const marker = document.createElement("div");
        marker.className = "black-marker";
        barContainer.appendChild(marker);

        container.appendChild(barContainer);

        // Create and append the text element.
        const textDiv = document.createElement("div");
        textDiv.className = "capacity-description";
        textDiv.textContent = generateText(item.availableHours, item.allocatedHours);
        container.appendChild(textDiv);
    });
}

function findAvailableHours(userName)
{
    let availableHours = 40;
    for(var index in capacityData)
    {
        let capacityDataItem = capacityData[index];
        console.log(capacityDataItem);
        if(capacityDataItem.user === userName)
        {
            availableHours = capacityDataItem.availableHours;   
            break;
        }
    }
    return availableHours;
}

async function bindData() {
        const options = { method: "GET" };

        capacityData = [];
        taskData = [];

        let capacityUrl = `/form/2/${kf.account._id}/Capacity_A00/list`;
        let capacityResponse = await kf.api(capacityUrl, options).then(response => {
            const records = response.Data;
            records.forEach(item => {
                capacityData.push(
                    {
                        user: item.Team_Member.Name,
                        availableHours: item.Capacity_Available
                    }
                );
            });
        }).catch(error => {
            console.error('Error fetching records:', error);
            kf.client.showInfo(error);
        });

        let taskUrl = `/form/2/${kf.account._id}/Task_A00/list`;
        let taskResponse = await kf.api(taskUrl, options).then(response => {
            const records = response.Data;
            const recordCount = records.length;
            
            records.forEach(item => {
                const userToFind = item.Assigned_To.Name;
                const userCapacity = findAvailableHours(userToFind);
                taskData.push(
                    {
                        label: item.Assigned_To.Name,
                        availableHours: userCapacity,
                        allocatedHours: item.Remaining_Hours
                    }
                );
            });
            renderCapacityBars(taskData);
        }).catch(error => {
            console.error('Error fetching records:', error);
            kf.client.showInfo(error);
        });
}