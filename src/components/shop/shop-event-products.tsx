"use client";

import { cn } from "@/lib/utils";
import { CachedWishlist } from "@/lib/validations";
import Link from "next/link";
import { EventProductCard } from "../globals/cards";
import { Icons } from "../icons"; // Make sure to have ChevronRight in your Icons object
import { Button } from "../ui/button-general";
import {
  EmptyPlaceholder,
  EmptyPlaceholderContent,
  EmptyPlaceholderDescription,
  EmptyPlaceholderIcon,
  EmptyPlaceholderTitle,
} from "../ui/empty-placeholder-general";
import { getEventProducts } from "@/actions/event-page";
import { ExhibitionCarousel } from "./carousel-component";
import {
  useQueryState,
  parseAsInteger,
  parseAsArrayOf,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs";
import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";

// --- 1. Final, Accurate PromoBanner Component ---
const PromoBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [dotPulse, setDotPulse] = useState({ dot1: false, dot2: false });

  const imageUrl1 = "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNoKrKNg0WvnGEidmOVIP6xXt4S7befYUykMJq";
  const imageUrl2 = "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNzE3GE0wvAfHxUCD4uo0de9jTMakKRhw8ctYL";

  useEffect(() => {
    setIsVisible(true);
    
    // Staggered dot pulse animation
    const interval = setInterval(() => {
      setDotPulse({ dot1: true, dot2: false });
      setTimeout(() => {
        setDotPulse({ dot1: false, dot2: true });
      }, 1500);
      setTimeout(() => {
        setDotPulse({ dot1: false, dot2: false });
      }, 3000);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative mb-4 overflow-hidden">
      {/* Animated Background with Gradient Overlay */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 animate-gradient-shift"
        style={{ 
          backgroundImage: "url('https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNxfgOi01IezOinSmtdvjDw08UlbRkW2MQqNBX')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Floating Elements */}
        <div className="absolute top-4 left-4 w-3 h-3 bg-purple-300/40 rounded-full animate-float-1"></div>
        <div className="absolute top-8 right-8 w-2 h-2 bg-pink-300/40 rounded-full animate-float-2"></div>
        <div className="absolute bottom-6 left-8 w-4 h-4 bg-orange-300/40 rounded-full animate-float-3"></div>
        <div className="absolute bottom-4 right-6 w-2.5 h-2.5 bg-yellow-300/40 rounded-full animate-float-1"></div>
      </div>

      {/* Main banner container */}
      <div className="relative flex h-[250px] items-center overflow-hidden p-4">
        {/* Left side - Images container */}
        <div className={`flex w-1/2 h-full transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
          {/* Female Model Image */}
          <div className="relative w-1/2 h-full group">
            <div className="relative h-full w-full overflow-hidden rounded-lg shadow-lg transform transition-transform duration-500 hover:scale-105">
              <img
                src={imageUrl1}
                alt="Female model"
                className="w-full h-full object-contain object-center transition-transform duration-700 hover:scale-110"
              />
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shine"></div>
            </div>
            
            {/* Enhanced Clickable dot */}
            <Link
              href="https://renivet.com/shop?brandIds=56b9f87d-fbbb-4ae7-8a43-fe19686968cf"
              className="absolute z-20"
              style={{ top: '60%', left: '70%' }}
            >
              <div className={`relative h-4 w-4 cursor-pointer rounded-full bg-white ring-2 ring-black shadow-xl hover:scale-125 transition-all duration-300 flex items-center justify-center group ${dotPulse.dot1 ? 'animate-pulse-strong' : ''}`}>
                <div className="h-1.5 w-1.5 rounded-full bg-black group-hover:bg-purple-600 transition-colors"></div>
                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-20 group-hover:opacity-40"></div>
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  Shop Women's
                </div>
              </div>
            </Link>
          </div>
          
          {/* Male Model Image */}
          <div className="relative w-1/2 h-full ml-[-2px] group">
            <div className="relative h-full w-full overflow-hidden rounded-lg shadow-lg transform transition-transform duration-500 hover:scale-105">
              <img
                src={imageUrl2}
                alt="Male model"
                className="w-full h-full object-contain object-center transition-transform duration-700 hover:scale-110"
              />
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shine"></div>
            </div>
            
            {/* Enhanced Clickable dot */}
            <Link
              href="https://renivet.com/shop?brandIds=56b9f87d-fbbb-4ae7-8a43-fe19686968cf"
              className="absolute z-20"
              style={{ top: '70%', left: '30%' }}
            >
              <div className={`relative h-4 w-4 cursor-pointer rounded-full bg-white ring-2 ring-black shadow-xl hover:scale-125 transition-all duration-300 flex items-center justify-center group ${dotPulse.dot2 ? 'animate-pulse-strong' : ''}`}>
                <div className="h-1.5 w-1.5 rounded-full bg-black group-hover:bg-blue-600 transition-colors"></div>
                {/* Ripple effect */}
                <div className="absolute inset-0 rounded-full bg-white animate-ping opacity-20 group-hover:opacity-40"></div>
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                  Shop Men's
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Right side - Text content with animations */}
        <div className={`flex flex-col justify-center w-1/2 pl-6 text-left transition-all duration-1200 delay-300 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
          {/* Brand name with glow effect */}
          <h3 className="text-sm font-bold tracking-wider text-black mb-1 relative">
            <span className="relative z-10">RENIVET</span>
            <span className="absolute inset-0 text-purple-600 blur-sm opacity-30 animate-pulse">RENIVET</span>
          </h3>
          
          {/* Main heading with gradient animation */}
          <h2 className="text-lg font-bold leading-tight mb-2 italic bg-gradient-to-r from-black via-purple-800 to-black bg-clip-text text-transparent animate-gradient-text">
            Conscious Looks For Modern Duos
          </h2>
          
          {/* Description with typewriter effect simulation */}
          <p className="text-xs text-black mb-4 leading-relaxed opacity-0 animate-fade-in-up">
            Step Into Effortless Style With Co-Ord Sets Designed To Match Your Vibe. Ethically Made For Those Who Care.
          </p>
          
          {/* Enhanced CTA button */}
          <Link href="/collections/renivet">
            <div className="inline-flex items-center justify-center rounded-md border-2 border-black bg-transparent px-6 py-3 text-xs font-bold text-black hover:bg-black hover:text-white transition-all duration-300 cursor-pointer relative overflow-hidden group shadow-lg hover:shadow-xl transform hover:scale-105">
              <span className="relative z-10 tracking-wide">Buy Now</span>
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform -skew-x-12 group-hover:animate-shine"></div>
              {/* Button pulse ring */}
              <div className="absolute inset-0 rounded-md border-2 border-purple-400 opacity-0 group-hover:opacity-100 animate-pulse"></div>
            </div>
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(120deg); }
          66% { transform: translateY(-10px) rotate(240deg); }
        }
        
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(180deg); }
        }
        
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-8px) rotate(90deg); }
          75% { transform: translateY(-12px) rotate(270deg); }
        }
        
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        
        @keyframes pulse-strong {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          50% { transform: scale(1.2); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        }
        
        @keyframes gradient-text {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        
        .animate-float-1 {
          animation: float-1 6s ease-in-out infinite;
        }
        
        .animate-float-2 {
          animation: float-2 4s ease-in-out infinite;
        }
        
        .animate-float-3 {
          animation: float-3 5s ease-in-out infinite;
        }
        
        .animate-shine {
          animation: shine 1s ease-out;
        }
        
        .animate-pulse-strong {
          animation: pulse-strong 2s infinite;
        }
        
        .animate-gradient-text {
          background-size: 200% 200%;
          animation: gradient-text 3s ease infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out 0.8s forwards;
        }
      `}</style>
    </div>
  );
};
const PromoSection = () => {
  const [currentFlipped, setCurrentFlipped] = useState(0);

  const promoCards = [
    {
      id: 1,
      title: "DREAM DEALS DAY",
      subtitle: "UP TO 40% OFF",
      bgColor: "bg-gradient-to-br from-amber-50 via-amber-100 to-orange-200",
      backBgColor: "bg-gradient-to-br from-amber-800 via-orange-700 to-red-600",
      textColor: "text-amber-900",
      borderColor: "border-amber-300",
      accentColor: "from-amber-400",
      link: "/deals/dream-deals",
      imageFront: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNLFiqLIFUt5ndSiE7wT2jaklrZXQ6vYpAbfHy",
      imageBack: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNX0iRyP3We049OUSYNxCLnRIka3FhcqBZlbsP",
      icon: "⭐"
    },
    {
      id: 2,
      title: "BEAUTY PARTNER",
      subtitle: "UP TO 15% OFF",
      bgColor: "bg-gradient-to-br from-pink-50 via-pink-100 to-rose-200",
      backBgColor: "bg-gradient-to-br from-pink-800 via-rose-700 to-purple-600",
      textColor: "text-rose-900",
      borderColor: "border-rose-300",
      accentColor: "from-rose-400",
      link: "/deals/beauty-partner",
      imageFront: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNtkiuyIRj63QywZkxrW40qSphaIEcmUdXDAVl",
      imageBack: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNX0iRyP3We049OUSYNxCLnRIka3FhcqBZlbsP",
      icon: "💄"
    },
    {
      id: 3,
      title: "Fashion Festival",
      subtitle: "50-90% OFF",
      bgColor: "bg-gradient-to-br from-purple-50 via-purple-100 to-pink-200",
      backBgColor: "bg-gradient-to-br from-purple-800 via-indigo-700 to-blue-600",
      textColor: "text-purple-900",
      borderColor: "border-purple-300",
      accentColor: "from-purple-400",
      link: "/deals/fashion-festival",
      imageFront: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNbth2WVuZc50VbmLPHAdU9KwxEkCINyqDWJRr",
      imageBack: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNX0iRyP3We049OUSYNxCLnRIka3FhcqBZlbsP",
      icon: "👗"
    },
    {
      id: 4,
      title: "EARLY BIRD DEAL",
      subtitle: "Shop Now",
      bgColor: "bg-gradient-to-br from-yellow-50 via-yellow-100 to-amber-200",
      backBgColor: "bg-gradient-to-br from-yellow-800 via-amber-700 to-orange-600",
      textColor: "text-amber-900",
      borderColor: "border-yellow-300",
      accentColor: "from-yellow-400",
      link: "/deals/early-bird",
      imageFront: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdshBBwb4imNMJ6l9SbIRxWLcDyX3vTqk2UVG",
      imageBack: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNX0iRyP3We049OUSYNxCLnRIka3FhcqBZlbsP",
      icon: "🎯"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFlipped((prev) => (prev + 1) % promoCards.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [promoCards.length]);

  return (
    <div className="block md:hidden px-3 py-6 bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Special Offers
        </h2>
        <div className="w-16 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 mx-auto mt-1"></div>
      </div>

      {/* Cards Container */}
      <div className="flex justify-between gap-2">
        {promoCards.map((card, index) => (
          <div 
            key={card.id} 
            className="flex-1 h-[130px]"
            style={{ perspective: '1000px' }}
          >
            <div 
              className={`
                relative h-full w-full transition-all duration-1000 ease-in-out transform-gpu
                ${currentFlipped === index ? 'rotate-y-180' : 'rotate-y-0'}
              `}
              style={{ 
                transformStyle: 'preserve-3d',
                transformOrigin: 'center center'
              }}
            >
              {/* FRONT FACE */}
              <div 
                className="absolute inset-0 w-full h-full backface-hidden"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <Link href={card.link}>
                  <div className={`
                    relative h-full w-full overflow-hidden rounded-2xl border-2 ${card.borderColor} ${card.bgColor}
                    shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105
                  `}>
                    {/* Animated Background Pattern */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className={`absolute -top-4 -right-4 w-8 h-8 ${card.accentColor} to-transparent bg-gradient-to-br rounded-full opacity-20 animate-float`}></div>
                      <div className={`absolute -bottom-2 -left-2 w-6 h-6 ${card.accentColor} to-transparent bg-gradient-to-br rounded-full opacity-15 animate-float-delayed`}></div>
                    </div>

                    {/* Decorative Corners with Glow */}
                    <div className={`absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 ${card.accentColor.replace('from-', 'border-')} rounded-tl-2xl opacity-70 shadow-sm`}></div>
                    <div className={`absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 ${card.accentColor.replace('from-', 'border-')} rounded-tr-2xl opacity-70 shadow-sm`}></div>
                    <div className={`absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 ${card.accentColor.replace('from-', 'border-')} rounded-bl-2xl opacity-70 shadow-sm`}></div>
                    <div className={`absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 ${card.accentColor.replace('from-', 'border-')} rounded-br-2xl opacity-70 shadow-sm`}></div>

                    {/* Centered Image with Glow Effect */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className={`w-14 h-14 rounded-full overflow-hidden bg-white/40 backdrop-blur-md border-2 border-white/60 shadow-lg ${currentFlipped === index ? 'ring-4 ring-green-300 ring-opacity-50' : ''} transition-all duration-300`}>
                        <img
                          src={card.imageFront}
                          alt={card.title}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        />
                      </div>
                    </div>

                    {/* Content with Better Typography */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <div className="bg-white/30 backdrop-blur-md rounded-lg p-1.5 border border-white/40">
                        <h3 className={`font-black text-[9px] mb-1 ${card.textColor} drop-shadow-md text-center leading-tight tracking-wide`}>
                          {card.title}
                        </h3>
                        <div className="flex justify-center">
                          <p className={`text-[8px] font-bold ${card.textColor} bg-white/60 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/50 shadow-sm`}>
                            {card.subtitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="absolute top-2 left-2">
                      <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        currentFlipped === index 
                          ? 'bg-green-400 shadow-lg shadow-green-400/50 animate-pulse scale-125' 
                          : 'bg-white/40'
                      }`}></div>
                    </div>

                    {/* Icon Badge */}
                    <div className="absolute top-1 right-2 text-lg opacity-60">
                      {card.icon}
                    </div>

                    {/* Gradient Bottom Accent */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.accentColor} via-transparent to-${card.accentColor.split('-')[1]}-300 rounded-b-2xl`}></div>
                  </div>
                </Link>
              </div>

              {/* BACK FACE */}
              <div 
                className="absolute inset-0 w-full h-full backface-hidden"
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <Link href={card.link}>
                  <div className={`
                    relative h-full w-full overflow-hidden rounded-2xl border-2 border-white/30
                    shadow-xl ${card.backBgColor}
                  `}>
                    {/* Animated Stars Background */}
                    <div className="absolute inset-0 overflow-hidden">
                      <div className="absolute top-2 left-2 w-1 h-1 bg-white rounded-full animate-twinkle"></div>
                      <div className="absolute top-4 right-3 w-0.5 h-0.5 bg-yellow-300 rounded-full animate-twinkle-delayed"></div>
                      <div className="absolute bottom-4 left-4 w-0.5 h-0.5 bg-pink-300 rounded-full animate-twinkle"></div>
                      <div className="absolute bottom-2 right-2 w-1 h-1 bg-purple-300 rounded-full animate-twinkle-delayed"></div>
                    </div>

                    {/* Premium Corners */}
                    <div className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-white/60 rounded-tl-2xl"></div>
                    <div className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-white/60 rounded-tr-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 border-white/60 rounded-bl-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-white/60 rounded-br-2xl"></div>

                    {/* Centered Back Image with Premium Effect */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-white/10 backdrop-blur-md border-2 border-white/30 shadow-2xl ring-2 ring-white/20">
                        <img
                          src={card.imageBack}
                          alt={`${card.title} Back`}
                          className="w-full h-full object-cover opacity-90"
                        />
                      </div>
                    </div>

                    {/* Premium Back Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <div className="bg-black/20 backdrop-blur-md rounded-lg p-1.5 border border-white/20">
                        <h3 className="font-black text-[9px] mb-1 text-white drop-shadow-lg text-center leading-tight">
                          EXCLUSIVE OFFER
                        </h3>
                        <div className="flex justify-center">
                          <p className="text-[8px] font-bold text-white bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/30">
                            Tap to Explore
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Premium Indicator */}
                    <div className="absolute top-2 left-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50 animate-pulse"></div>
                    </div>

                    {/* Premium Badge */}
                    <div className="absolute top-1 right-2 text-lg">
                      ✨
                    </div>

                    {/* Rainbow Bottom Accent */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 via-yellow-400 to-green-400 rounded-b-2xl"></div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Progress Indicators */}
      <div className="flex justify-center mt-4 gap-2">
        {promoCards.map((card, index) => (
          <div
            key={index}
            className={`transition-all duration-500 rounded-full ${
              currentFlipped === index 
                ? 'w-6 h-2 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg' 
                : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>


      <style jsx>{`
        .transform-gpu {
          transform: translateZ(0);
        }
        
        .backface-hidden {
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }
        
        .rotate-y-0 {
          transform: rotateY(0deg);
        }
        
        .rotate-y-180 {
          transform: rotateY(180deg);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(180deg); }
        }

        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-2px) rotate(-180deg); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes twinkle-delayed {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          25%, 75% { opacity: 0.8; transform: scale(1.1); }
        }

        @keyframes fade-in-out {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite;
        }

        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }

        .animate-twinkle-delayed {
          animation: twinkle-delayed 2.5s ease-in-out infinite;
        }

        .animate-fade-in-out {
          animation: fade-in-out 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

interface ShopEventProductsProps {
  className?: string;
  initialData: any[];
  initialWishlist?: CachedWishlist[];
  userId?: string;
  showCarousel?: boolean;
}

const categories = [
  { id: "16d40bb3-3061-4790-b9b7-253cb078dfe1", name: "Women", image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNLFiqLIFUt5ndSiE7wT2jaklrZXQ6vYpAbfHy" },
  { id: "0b7046fc-6962-4469-81c2-412ed6949c02", name: "Men", image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNbth2WVuZc50VbmLPHAdU9KwxEkCINyqDWJRr"},
  { id: "22816fa3-d57e-4e3b-bc0e-72edf4635124", name: "Kids", image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNdshBBwb4imNMJ6l9SbIRxWLcDyX3vTqk2UVG" },
  { id: "173e1e71-e298-4301-b542-caa29d3950bf", name: "Home & Living", image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNmWeViQNpGL6AgslOfF3vz5Wa1NUerQXMBIPZ" },
  { id: "08ce51fe-adb8-4086-acfd-759772767ec8", name: "Beauty", image: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNtkiuyIRj63QywZkxrW40qSphaIEcmUdXDAVl" },

];

export function ShopEventProducts({
  className,
  initialData,
  initialWishlist,
  userId,
  showCarousel = true,
}: ShopEventProductsProps  ) {
  const wishlist = initialWishlist ?? [];

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [brandIds] = useQueryState("brandIds", parseAsArrayOf(parseAsString, ",").withDefault([]));
  const [categoryId, setCategoryId] = useQueryState("categoryId", parseAsString.withDefault(""));
  const [subCategoryId] = useQueryState("subCategoryId", parseAsString.withDefault(""));
  const [minPrice] = useQueryState("minPrice", parseAsInteger);
  const [maxPrice] = useQueryState("maxPrice", parseAsInteger);
  const [sortBy] = useQueryState("sortBy", parseAsStringLiteral(["price", "createdAt"] as const).withDefault("createdAt"));
  const [sortOrder] = useQueryState("sortOrder", parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"));

  const [products, setProducts] = useState(initialData);
  const [hasMore, setHasMore] = useState(initialData.length === 24);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const prevFilters = useRef({
    brandIds: brandIds.join(","),
    categoryId,
    subCategoryId,
    minPrice,
    maxPrice,
    sortBy,
    sortOrder,
  });

  const fetchProducts = async (targetPage: number, append = false) => {
    if (!hasMore && append) return;

    setLoading(true);
    const filters = {
      page: targetPage,
      limit: 24,
      brandIds: brandIds,
      categoryId: categoryId || undefined,
      subCategoryId: subCategoryId || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sortBy: sortBy,
      sortOrder: sortOrder,
    };

    const data = await getEventProducts(filters);

    if (data.length === 0) {
      setHasMore(false);
    } else {
      setProducts((prev) => (append ? [...prev, ...data] : data));
      setHasMore(data.length === 24);
    }

    setLoading(false);
  };

  useEffect(() => {
    const currentFilters = {
      brandIds: brandIds.join(","),
      categoryId,
      subCategoryId,
      minPrice,
      maxPrice,
      sortBy,
      sortOrder,
    };

    const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(prevFilters.current);

    if (filtersChanged) {
      fetchProducts(1, false);
      setPage(1);
      prevFilters.current = currentFilters;
    }
  }, [brandIds, categoryId, subCategoryId, minPrice, maxPrice, sortBy, sortOrder]);

  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProducts(nextPage, true);
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerRef.current);

    return () => observer.disconnect();
  }, [page, hasMore, loading]);


  if (!products.length) return <NoProductCard />;
  return (
    <div className="min-h-screen relative overflow-hidden "
     style={{ background: "linear-gradient(to bottom, #EDE7F6, #D1C4E9)", backgroundImage:
      "url('https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNxfgOi01IezOinSmtdvjDw08UlbRkW2MQqNBX')" }}
        >
              <div className="px-2 bg-[#e2d4ee]" style={{ backgroundImage:
      "url('https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNxfgOi01IezOinSmtdvjDw08UlbRkW2MQqNBX')" }}>
          <div className="rounded-2xl py-4 px-2 shadow-sm w-full overflow-hidden" style={{ backgroundColor: "#e1d5ea", backgroundImage:
      "url('https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNxfgOi01IezOinSmtdvjDw08UlbRkW2MQqNBX')" }}>
            <div className="grid grid-cols-5 gap-1 w-full">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/events/${cat.id}`} className="flex flex-col items-center justify-center w-full">
                  <div className="rounded-full overflow-hidden mb-1 mx-auto" style={{ width: "48px", height: "45px", backgroundColor: "#5f3297" }}>
                    <img src={cat.image || "/images/placeholder.png"} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                  <span
                    className={cn("text-center leading-tight w-full", categoryId === cat.id ? "text-purple-600" : "text-gray-600")}
                    style={{ fontSize: "9px", lineHeight: "10px", wordBreak: "break-word", hyphens: "auto" }}
                  >
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      {/* Mobile-only container for Carousel and Categories */}
      <div className="block md:hidden bg-[#eaddf7]"
     style={{ background: "linear-gradient(to bottom, #EDE7F6, #D1C4E9)" }}
      >
        {showCarousel && (
          <ExhibitionCarousel
            slides={[
              {
                imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNI3arTLrApCnKbtW0hkXs6adUVPBQFlvOi2ME",
                url: "/events/hyderabad",
                title: "",
                date: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNv8oVjBdPZsh5fuDbkAelMyqICmp3NU7X4nHY",
                description: ""
              },
                  {
                imageUrl: "https://4o4vm2cu6g.ufs.sh/f/HtysHtJpctzNv8oVjBdPZsh5fuDbkAelMyqICmp3NU7X4nHY",
                url: "/events/hyderabad",
                title: "",
                date: "",
                description: ""
              },
            ]}
          />
        )}

        {/* Category Section */}
        {/* <div className="mt-2 px-2 bg-[#e2d4ee]">
          <div className="rounded-2xl py-4 px-2 shadow-sm w-full overflow-hidden" style={{ backgroundColor: "#e1d5ea" }}>
            <div className="grid grid-cols-5 gap-1 w-full">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/events/${cat.id}`} className="flex flex-col items-center justify-center w-full">
                  <div className="rounded-full overflow-hidden mb-1 mx-auto" style={{ width: "48px", height: "45px", backgroundColor: "#5f3297" }}>
                    <img src={cat.image || "/images/placeholder.png"} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                  <span
                    className={cn("text-center leading-tight w-full", categoryId === cat.id ? "text-purple-600" : "text-gray-600")}
                    style={{ fontSize: "9px", lineHeight: "10px", wordBreak: "break-word", hyphens: "auto" }}
                  >
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div> */}
        {/* --- 2. Final, Accurate PromoBanner is placed here --- */}
        <PromoSection />
        <PromoBanner />

      </div>

      {/* Product Grid Section */}
<div className="mx-5 rounded-3xl p-7 md:mx-0 md:rounded-none md:bg-transparent md:p-0 relative overflow-hidden" 
     style={{
       background: "linear-gradient(to bottom, #EDE7F6, #D1C4E9)",
     }}>
  {/* Geometric background pattern */}
  <div className="absolute inset-0 opacity-10">
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="hexagons" x="0" y="0" width="50" height="43.4" patternUnits="userSpaceOnUse">
          <polygon points="25,2 45,15 45,35 25,48 5,35 5,15" fill="none" stroke="#7C3AED" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexagons)" />
    </svg>
  </div>

  {/* Floating elements */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-purple-300/20 to-indigo-300/20 rounded-full animate-pulse"></div>
    <div className="absolute top-1/3 -right-16 w-32 h-32 bg-gradient-to-br from-pink-300/20 to-purple-300/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
    <div className="absolute -bottom-16 left-1/4 w-48 h-48 bg-gradient-to-br from-indigo-300/20 to-purple-300/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
  </div>

  <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-20 lg:grid-cols-3 xl:grid-cols-4", className)}>
    {products.map((eventItem) => {
      const product = eventItem.product;
      const isWishlisted = wishlist?.some((item) => item.productId === product.id) ?? false;

      return (
        <div key={product.id} className="cursor-pointer bg-transparent">
          <EventProductCard product={product} isWishlisted={isWishlisted} userId={userId} />
        </div>
      );
    })}
  </div>

  {loading && (
    <div className="flex justify-center items-center mt-4">
      <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
    </div>
  )}

  {hasMore && !loading && <div ref={observerRef} className="h-10 relative z-10"></div>}

  {!hasMore && !loading && <p className="text-center mt-4 text-gray-500">No more products to show.</p>}
</div>
    </div>
  );
}

function NoProductCard() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 p-6">
      <EmptyPlaceholder isBackgroundVisible={false} className="w-full max-w-full border-none">
        <EmptyPlaceholderIcon>
          <Icons.AlertTriangle className="size-10" />
        </EmptyPlaceholderIcon>

        <EmptyPlaceholderContent>
          <EmptyPlaceholderTitle>No products found</EmptyPlaceholderTitle>
          <EmptyPlaceholderDescription>We couldn&apos;t find any event products. Try adjusting your filters.</EmptyPlaceholderDescription>
        </EmptyPlaceholderContent>

        <Button asChild>
          <Link href="/">Go back</Link>
        </Button>
      </EmptyPlaceholder>
    </div>
  );
}
