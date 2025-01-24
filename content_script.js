/*global chrome*/
/*eslint no-undef: "error"*/


console.log("Shiroha is OK!!!!!!!!!")

const currentURL = window.location.href
const ATCODER = currentURL.includes('kenkoooo.com/atcoder#/table')
//const CODEFORCES = currentURL.includes('cf.kira924age.com/#/table/')
const BODY = document.querySelector('body')


/**
 * @description 正常字符串转InnerHTML
 * @param {String} text 
 */
const StringToInnerHTML = (text) => {
    return text.replaceAll("\n", '<br>')
}

/**
 * @description InnerHTML转正常字符串
 * @param {String} text 
 */
const InnerHTMLToString = (text) => {
    return text.replaceAll('<br>', "\n")
}


/**
 * @description 在网站的导航栏添加上传文件按钮
 * 
 * @returns {HTMLButtonElement} fileUploadButton 文件上传按钮
 */
const createFileUploadButton = (note) => {
    // 找出 header 的 nav 导航栏元素
    let element
    if (ATCODER) element = document.querySelector(".ml-auto.navbar-nav")
    else element = document.querySelector(".menu-row")

    // input 元素实现文件上传
    const input = document.createElement("input")
    element.appendChild(input)
    input.style.display = "none"
    input.type = "file"
    input.accept = ".json"

    // 上传文件按钮
    const fileUploadButton = document.createElement("button")
    element.appendChild(fileUploadButton)
    fileUploadButton.classList.add("btn", "btn-primary")
    fileUploadButton.type = "button"
    fileUploadButton.id = "fileUploadButton"
    fileUploadButton.textContent = "上传 json 文件"
    fileUploadButton.addEventListener('click', () => {
        input.click() // 激活 input 元素
    })

    // 读取文件
    input.addEventListener('input', () => {
        let reader = new FileReader()
        reader.onload = (e) => {
            let jsonString = e.target.result
            let jsonObject = JSON.parse(jsonString)
            // console.log(jsonObject)
            note.data = jsonObject // 读取的文件存入 fileUploadButton
        }
        reader.readAsText(input.files[0]) // 读取上传的 json 文件
    })

    return fileUploadButton
}


/**
 * @description 创建 Dialog
 * 
 * @returns {HTMLDialogElement} Dialog
 */
const createDialog = () => {
    const modal = document.createElement('div')
    const modalDialog = document.createElement("div")
    const modalContent = document.createElement('div')
    const modalHeader = document.createElement('div')
    const modalBody = document.createElement('div')
    const modalFooter = document.createElement('div')

    BODY.appendChild(modal)
    modal.appendChild(modalDialog)
    modalDialog.appendChild(modalContent)
    modalContent.appendChild(modalHeader)
    modalContent.appendChild(modalBody)
    modalContent.appendChild(modalFooter)

    modal.classList.add("modal", "fade")
    modalDialog.classList.add("modal-dialog", "modal-dialog-centered", "modal-dialog-scrollable", "modal-xl")
    modalContent.classList.add('modal-content')
    modalHeader.classList.add('modal-header')
    modalBody.classList.add('modal-body')
    modalFooter.classList.add('modal-footer')


    // 题目链接
    const a = document.createElement('a')
    a.id = "problemLink"
    a.style.fontSize = "26px"
    a.style.fontWeight = "bold"


    // Header 的关闭按钮
    const close1 = document.createElement('button')
    close1.type = "button"
    close1.classList.add("btn-close")
    close1.setAttribute("data-bs-dismiss", "modal")
    close1.setAttribute("aria-label", "Close")


    // 文本 
    const textDiv = document.createElement('div')
    textDiv.id = "text"


    // Footer 的关闭按钮
    const close2 = document.createElement('button')
    close2.type = "button"
    close2.textContent = "关闭"
    close2.classList.add("btn", "btn-secondary")
    close2.setAttribute("data-bs-dismiss", "modal")


    // Footer 的编辑按钮
    const edit = document.createElement('button')
    edit.type = "button"
    edit.textContent = "编辑"
    edit.classList.add("btn", "btn-primary")


    // textArea 文字输入框
    const textAreaDiv = document.createElement("div")
    textAreaDiv.classList.add("form-floating")

    const textArea = document.createElement("textarea")
    textAreaDiv.appendChild(textArea)
    textArea.classList.add("form-control")
    textArea.style.height = "500px"
    textArea.id = "textArea"

    const label = document.createElement("label")
    textAreaDiv.appendChild(label)
    label.setAttribute("for", "textArea")
    label.textContent = "笔记"



    modal.id = "dialog"

    modalHeader.appendChild(a)
    modalHeader.appendChild(close1)

    modalBody.appendChild(textDiv)

    modalFooter.appendChild(close2)
    modalFooter.appendChild(edit)



    // 编辑按钮点击事件
    modal.isEditing = false

    /**
     * @description 退出编辑模式
     */
    modal.endEditing = () => {
        modal.isEditing = false
        if (modalBody.contains(textAreaDiv)) modalBody.removeChild(textAreaDiv)
        if (!modalBody.contains(textDiv)) modalBody.appendChild(textDiv)
        edit.textContent = "编辑"
        close2.textContent = "关闭"
        close2.setAttribute("data-bs-dismiss", "modal")
        close2.removeEventListener("click", modal.endEditing)

        // textDiv 填充文本
        const link = modalHeader.querySelector("a")
        chrome.storage.local.get(`${link.href}`, (result) => {
            if (result[link.href] === undefined) textDiv.innerHTML = "本题尚无笔记"
            else textDiv.innerHTML = result[link.href]
        })

    }

    edit.addEventListener("click", () => {
        modal.isEditing = !modal.isEditing

        if (modal.isEditing) {
            // 进入编辑模式
            textArea.value = InnerHTMLToString(textDiv.innerHTML)
            modalBody.removeChild(textDiv)
            modalBody.appendChild(textAreaDiv)

            edit.textContent = "保存"
            close2.textContent = "取消"

            close2.removeAttribute("data-bs-dismiss")
            close2.addEventListener("click", modal.endEditing)

        } else {
            // 保存当前笔记
            const link = modalHeader.querySelector("a")
            let dict = {}
            dict[link.href] = StringToInnerHTML(textArea.value)
            chrome.storage.local.set(dict)

            // 退出编辑模式
            modal.endEditing()
        }
    })


    return modal
}


/**
 * @description 处理表格里的问题单元格
 * 
 * - 在问题的 difficulty-circle 设置 click 事件，故传入 clickCallback 函数
 * 
 * @param {Function} clickCallback 难度圆点击事件函数
 */
const handleTableProblem = (clickCallback) => {
    // 找出所有表格元素
    let tableProblemElements
    if (ATCODER) tableProblemElements = document.querySelectorAll(".table-problem")
    else tableProblemElements = document.querySelectorAll(".ant-table-cell")

    tableProblemElements.forEach(
        (element) => {
            // 找到表格里的 难度圆 和 题目链接
            let circle, link
            if (ATCODER) circle = element.querySelector('.difficulty-circle')
            else circle = element.querySelector('.common-difficulty-circle')
            link = element.querySelector('a')

            if (circle) {
                circle.setAttribute("data-bs-toggle", "modal")
                circle.setAttribute("data-bs-target", "#dialog")
                circle.addEventListener("click", () => {
                    clickCallback(link)
                })
            }
        }
    )
}




setTimeout(() => {
    const note = { data: '' }
    chrome.storage.local.get(null, (result) => {
        note.data = result
    })

    // 弹出窗口的各个元素
    const dialog = createDialog()
    const textDiv = dialog.querySelector('#text')
    const problemLink = dialog.querySelector('#problemLink')

    /**
     * @description 点击事件回调函数
     * @param {HTMLAnchorElement} link 
     */
    const clickCallback = (link) => {
        // 复制链接元素
        for (let attr of link.attributes)
            problemLink.setAttribute(attr.name, attr.value)
        problemLink.textContent = link.textContent

        // dialog 退出 edit 状态
        dialog.isEditing = false
        dialog.endEditing()
    }

    // 遍历表格元素，给难度圆添加点击事件
    handleTableProblem(clickCallback)


    // 监听当前选择 table，table 更新时重新遍历新的表格元素
    let targetElement
    if (ATCODER) targetElement = document.querySelector(".table-tab")
    else targetElement = document.querySelector("#radio-buttons")

    const observer = new MutationObserver(() => {
        handleTableProblem(clickCallback)
    })
    observer.observe(targetElement, {
        attributes: true,
        attributeFilter: ['class'],
        subtree: true
    })

}, 2000)
