// Dropdown Toggle Function
function toggleDropdown(service) {
    const dropdown = document.getElementById(`${service}-dropdown`);
    const arrow = document.getElementById(`${service}-arrow`);
    
    if (dropdown) {
        if (dropdown.style.maxHeight && dropdown.style.maxHeight !== '0px') {
            dropdown.style.maxHeight = '0px';
            if (arrow) arrow.style.transform = 'rotate(0deg)';
        } else {
            dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
            if (arrow) arrow.style.transform = 'rotate(90deg)';
        }
    }
}

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const closeMobileMenu = document.getElementById('closeMobileMenu');
const mobileMenu = document.getElementById('mobileMenu');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.add('open');
});

closeMobileMenu.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
});

// Slider Functionality
const sliderTrack = document.getElementById('sliderTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dots = document.querySelectorAll('.slider-dot');
let currentSlide = 0;
const totalSlides = 3;

function updateSlider() {
    sliderTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, index) => {
        if (index === currentSlide) {
            dot.style.backgroundColor = 'white';
            dot.style.opacity = '1';
        } else {
            dot.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
            dot.style.opacity = '0.6';
        }
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlider();
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlider();
}

nextBtn.addEventListener('click', nextSlide);
prevBtn.addEventListener('click', prevSlide);

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentSlide = index;
        updateSlider();
    });
});

// Auto-slide every 5 seconds
setInterval(nextSlide, 5000);

// Initialize first dot
updateSlider();

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        mobileMenu.classList.remove('open');
    }
});

const contentData = {
    save: [
        {
            title: "Earn 2.75% interest",
            desc: "Earn 2.75% AER interest (variable) with an Instant Access Savings Pot or Instant Access Cash ISA.",
            img: "https://images.unsplash.com/photo-1554629947-334ff61d85dc?auto=format&fit=crop&q=80&w=800",
            bgColor: "bg-[#0a1b33]" // Deep Navy
        },
        {
            title: "Save with roundups",
            desc: "Automatically turn spare change into savings every time you spend. Interest is paid monthly.",
            img: "https://images.unsplash.com/photo-1559589689-577aabd1db4f?auto=format&fit=crop&q=80&w=800",
            bgColor: "bg-[#ff4d4d]" // Bright Red
        },
        {
            title: "Get clear on your goals",
            desc: "Give your Savings Pots a purpose with targets, names and images.",
            img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
            bgColor: "bg-[#ff6b6b]" // Light Red/Coral
        }
    ],
    invest: [
        {
            title: "Invest from £1",
            desc: "Choose from a range of funds and start your investment journey with ease.",
            img: "https://images.unsplash.com/photo-1611974717484-245395702447?auto=format&fit=crop&q=80&w=800",
            bgColor: "bg-[#4338ca]"
        },
        {
            title: "Low cost funds",
            desc: "Invest in diversified portfolios managed by experts with simple fees.",
            img: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?auto=format&fit=crop&q=80&w=800",
            bgColor: "bg-[#10b981]"
        },
        {
            title: "Track performance",
            desc: "Watch your money grow with real-time tracking and regular insights.",
            img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
            bgColor: "bg-[#6366f1]"
        }
    ],
    retire: [
        {
            title: "Combine pensions",
            desc: "See all your old pensions in one place and take control of your retirement.",
            img: "https://images.unsplash.com/photo-1473186578172-c141e6798ee4?auto=format&fit=crop&q=80&w=800",
            bgColor: "bg-[#111827]"
        },
        {
            title: "Flexible drawdown",
            desc: "When the time comes, take your money out in a way that suits you.",
            img: "https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=800",
            bgColor: "bg-[#ec4899]"
        },
        {
            title: "Tax-efficient saving",
            desc: "Benefit from government tax relief on your pension contributions.",
            img: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800",
            bgColor: "bg-[#f59e0b]"
        }
    ]
};

function filterCards(category) {
    const grid = document.getElementById('cards-grid');
    const buttons = document.querySelectorAll('.filter-btn');
    
    // Update active button styling
    buttons.forEach(btn => {
        btn.classList.remove('bg-[#3a444e]', 'text-white');
        btn.classList.add('bg-[#f3f4f6]', 'text-[#3a444e]');
    });
    const activeBtn = document.getElementById(`btn-${category}`);
    activeBtn.classList.remove('bg-[#f3f4f6]', 'text-[#3a444e]');
    activeBtn.classList.add('bg-[#3a444e]', 'text-white');

    // Update Grid Content with smooth transition
    grid.style.opacity = '0';
    setTimeout(() => {
        grid.innerHTML = contentData[category].map(card => `
            <div class="relative group overflow-hidden rounded-[24px] ${card.bgColor} h-[520px] flex flex-col justify-end p-8 text-white cursor-pointer shadow-md transition-all duration-500 hover:-translate-y-2">
                <img src="${card.img}" class="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-luminosity group-hover:opacity-70 transition-opacity duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                
                <div class="relative z-10">
                    <div class="mb-4 flex justify-end">
                        <div class="w-10 h-10 border border-white/40 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        </div>
                    </div>
                    <h3 class="text-[28px] font-bold mb-3 tracking-tight leading-tight">${card.title}</h3>
                    <p class="text-[16px] text-white/90 leading-snug font-medium">${card.desc}</p>
                </div>
            </div>
        `).join('');
        grid.style.opacity = '1';
    }, 150);
}

// Ensure first load works
window.onload = () => filterCards('save');

