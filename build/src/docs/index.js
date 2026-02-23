"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const RouteDefined = [
    {
        name: "Operators",
        route: "operator",
        service: []
    },
    {
        name: "Admins",
        route: "admin",
        service: []
    }
];
const dirPath = node_path_1.default.join(__dirname, "pages"); // your folder path
const files = node_fs_1.default.readdirSync(dirPath);
// console.log("files found for docs generation", files, dirPath);
files.forEach((file) => {
    const filePath = node_path_1.default.join(dirPath, file);
    // skip non-js files if necessary
    if (file.endsWith(".ts") || file.endsWith(".js")) {
        const module = require(filePath).default;
        if (module && Array.isArray(module)) {
            for (let item of module) {
                //get route index
                let routeIndx = RouteDefined.findIndex(r => r.route === item.route);
                if (routeIndx >= -1) {
                    RouteDefined[routeIndx].service.push(item);
                }
            }
        }
    }
});
const MainPageHTML = `<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta http-equiv="X-UA-Compatible" content="IE=edge">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>API DOCUMENTATION</title>
   <style>
      body {
         margin: 0;
         font-family: monospace !important;
      }
      #page-innercontent{
         font-size: 120%;
      }
      .no-content-p{
         width: 70%;
         margin: auto;
         text-align: center;
         font-size: 25px;
         line-height: 1.5;
         margin-top: 10%;
      }
      table {
         border-collapse: collapse;
         min-width: 60%;
         border: 1px solid #ccc;
         margin-top: 15px;
      }

      table tr th {
         text-align: left;
         padding: 5px;
      }

      table tr td {
         padding: 15px 5px;
         border: 1px solid #ccc;
      }

      .page-container {
         display: flex;
      }

      .page-sidebar {
         flex: 20%;
         padding-top: 2rem;
         background-color: #000;
         min-height: 100vh;
      }

      .page-content {
         flex: 80%
      }
         
      .list-ul {
         list-style: none;
         padding:0px 12px;
         margin: 0;
         color:#FFF
      }
      .list-ul li {
         position: relative;
         padding: 10px;
         color: #FFF;
         text-transform: capitalize;
         display: flex;
         align-items: center;
      }
      .list-ul li:hover {
         background-color: dimgrey;
         border-radius: 5px;
         cursor:pointer
      }

      .list-ul li::after {
         content: '';
         position: absolute;
         right: 0;
         margin-right: 15px;
         top: 0;
         margin-top: 15px;
         display: block;
         border-left: 2px solid #FFF;
         border-bottom: 2px solid #FFF;
         width: 8px;
         height: 8px;
         float: right;
         transform: translate(50%, -50%) rotate(-45deg);
      }
      .sublist-nav{
         padding-left:30px;
      }
      .d-none{
         display:none
      }
      .list-ul a {
         color: #ccc9;
         text-decoration: none;
         display: block;
         padding: 10px 0px;
      }
      .list-ul a:hover {
         color: #FFF;
         font-weight:600
      }
      .list-ul svg {
         color: #FFF;
         margin-right:5px;
         text-decoration: none;
      }
      .list-ul .link-header {
         color: #eee;
         text-decoration: none;
         font-weight: 600;
         font-size: 130%;
         margin: 30px 0 10px;
      }
      .page-comment{
         line-height: 1.5;
         font-size: 90%;
         width: 90%;
      }
      .homeroute-parent{
         display: flex;
         justify-content: center;
         margin-top: 3rem;
      }
      .homeroute-child{
         border: 2px solid blue;
         padding: 10px 20px;
         border-radius: 20px;
         margin: 0px 10px;
         font-size: 1.2rem;
         cursor: pointer;
         color: blue;
      }
   </style>
</head>

<body>
   <main>
      <div class="page-container">
         <div class="page-sidebar d-none">
            <div class="sidebar-inner">

            </div>
         </div>
         <div class="page-content">
            <h1 style="text-align: center;">API DOCUMENTATION</h1>
            <div id="page-innercontent">
            <p class="no-content-p">This API documentation describes all the avaialable routes and endpoints supported by this service. Kindly select the route your want to access</p>
               <div class="homeroute-parent">
               ${RouteDefined.map((service) => `<div class="homeroute-child" id=${service.route}>${service.name}</div>`)?.join(" ")}
               </div>
            <div>
         </div>
      </div>
   </main>
</body>
<script>
var routePages=${JSON.stringify(RouteDefined)}
var routeClickedPage = {}

document.addEventListener("DOMContentLoaded", () => {
   document.querySelectorAll(".homeroute-child").forEach(routeItem => {
      routeItem.addEventListener("click", event => {
         let routeName = event.currentTarget.id
         let servicePages = routePages.find(e=>e.route===routeName).service
         if(!servicePages || servicePages.length===0) return alert("No content available for the selected route")
         routeClickedPage = servicePages
         document.querySelector(".page-sidebar").classList.remove("d-none")
         let ulSidebar = document.querySelector(".sidebar-inner")
         ulSidebar.innerHTML=""
         let ulHeaderContent=[]
         let ulSubContent=[]
         for(let i=0; i<servicePages.length; i++){
            let item=servicePages[i]
            ulHeaderContent.push('<ul class="list-ul"><li class="list-li ' + item.name.replace(/\ /g,"_") + '"><svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 1024 1024" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0 0 42 42h216v494z"></path></svg><span>' + item.name + '</span></li><div class="sublist-nav d-none ' + item.name + '">')
            ulSubContent = item.routes.map((a, j) =>'<a href="#" class="hrefLink" id="'+ item.name.replace(/\ /g,"_") + "."+ i + "." + j +'">'+a.sidebar+'</a>').join("")
            ulHeaderContent.push(ulSubContent,'</ul></div>')
         }
         ulSidebar.insertAdjacentHTML("beforeend", ulHeaderContent.join(""))
      })
   })


   document.querySelectorAll("div.sidebar-inner").forEach(ul => {
      ul.addEventListener("click", event => {
         let target = event.target.classList
       //  console.log("clicked sidebar",event.target.parentElement)
         if (target && target.contains("hrefLink")) {
            //get the ID of the target
            let targetID = event.target.id
            //if the ID does not have 3 slick
            if (!targetID) return alert("Documentation not set for the link")
            targetID = targetID.split(".")
            console.log(routeClickedPage)
            console.log("targetID",targetID)
            if (targetID.length !== 3) return alert("Wrong Documentation format, it should be like 'PageName.FunctionName' ")
            if ((routeClickedPage && targetID[1] && routeClickedPage[targetID[1]] && routeClickedPage[targetID[1]].routes && targetID[2] && routeClickedPage[targetID[1]].routes[targetID[2]])) {
            // return alert("Page exist oooo")
               let pageData = routeClickedPage[targetID[1]].routes[targetID[2]]
            let tableBody = pageData.docs && pageData.docs.map(e => ('<tr><td>'+e.field+'<br /><span>('+e.type.toLowerCase()+')</span></td><td>'+e.status+'</td><td>'+e.description+'</td></tr>'))
                     let innerContent ='<ul><li><h4 style="color: red; margin-bottom: 10px;">'+pageData.title+'</h4><div>'+pageData.method +' '+ pageData.url+'</div><small><strong>'+ pageData.header+'</strong></small><p class="page-comment">'+pageData.comment+'</p><table id="doc-table"><thead><tr><th>'+pageData.doc_header.field+'</th><th>'+pageData.doc_header.status+'</th><th>'+pageData.doc_header.description+'</th></tr></thead><tbody></tbody></table><h4 style="margin-top: 14;margin-bottom: 0;">Response data on success</h4><pre><code>'+pageData.response+'</code></pre></li></ul>'
                  let innThml = document.querySelector("#page-innercontent")
                  innThml.innerHTML =""
                  innThml.insertAdjacentHTML("beforeend",innerContent) 
                     for (let item of tableBody){
                        document.querySelector("#doc-table tbody").insertAdjacentHTML("beforeend",item)
                     }
            } else {
               alert("Page does not exist")
            }
         }else if (event.target.parentElement.classList.contains("list-li")){
            event.target.parentElement.parentElement.querySelector('.sublist-nav').classList.toggle("d-none")
         }else if(event.target.parentElement.classList.contains("list-ul")){
            event.target.parentElement.querySelector('.sublist-nav').classList.toggle("d-none")
         }  
      })
   })

})

</script>
</html>`;
exports.default = MainPageHTML;
