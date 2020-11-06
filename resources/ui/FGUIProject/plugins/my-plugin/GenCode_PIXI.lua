local function fuiTypeToMyType(type)
    if type == 'fgui.GGraph' then return 'PIXI.Container'
    elseif type == 'fgui.GImage' then return 'PIXI.Sprite'
    elseif type == 'fgui.GTextField' then return 'PIXI.Text'
    elseif type == 'fgui.GMovieClip' then return 'PIXI.AnimatedSprite'
    elseif type == 'fgui.Transition' then return 'ExtendedAnimeInstance'
    else return type end
end

local function findClass(classes, type)
    local classCnt = classes.Count
    for i=0,classCnt-1 do
        if classes[i].className == type then
            return true
        end
    end
    return false
end

local function genCode(handler)
    local settings = handler.project:GetSettings("Publish").codeGeneration
    local codePkgName = handler:ToFilename(handler.pkg.name); --convert chinese to pinyin, remove special chars etc.
    local exportCodePath = handler.exportCodePath..'/'..codePkgName
    local ns = 'fgui'
    local getMemberByName = settings.getMemberByName

    --CollectClasses(stripeMemeber, stripeClass, fguiNamespace)
    local classes = handler:CollectClasses(settings.ignoreNoname, settings.ignoreNoname, ns)
    handler:SetupCodeFolder(exportCodePath, "ts") --check if target folder exists, and delete old files

    local writer = CodeWriter.new({ blockFromNewLine=false, usingTabs=true  })
    writer:writeln('import * as pixi_fairygui from \'pixi_fairygui\';')
    writer:writeln('import { FComponent, ExtendedAnimeInstance } from \'pixi_fairygui/dist/def/index\';')
    writer:writeln()

    local classCnt = classes.Count
    for i=0,classCnt-1 do
        local classInfo = classes[i]
        local members = classInfo.members
        local references = classInfo.references

        writer:writeln('export class %s', classInfo.className)
        writer:startBlock()
        
        writer:writeln('public component: FComponent;')

        local memberCnt = members.Count
        for j=0,memberCnt-1 do
            local memberInfo = members[j]
            if memberInfo.group==1 then
                -- writer:writeln('public %s:%s.controller.Controller;', memberInfo.name, ns)
            else
                writer:writeln('public %s: %s;', memberInfo.varName, fuiTypeToMyType(memberInfo.type))
            end
        end

        writer:writeln('public static URL: string = "ui://%s%s";', handler.pkg.id, classInfo.resId)
        writer:writeln()

        writer:writeln('constructor(component: FComponent)')
        writer:startBlock()
        writer:writeln('this.component = component;')
        for j=0,memberCnt-1 do
            local memberInfo = members[j]
            if memberInfo.group==0 then
                if findClass(classes, memberInfo.type) then
                    writer:writeln('this.%s = new %s(<FComponent>(this.component.getChildByName("%s")));', memberInfo.varName, memberInfo.type, memberInfo.name)
                elseif getMemberByName then
                    writer:writeln('this.%s = <%s>(this.component.getChildByName("%s"));', memberInfo.varName, fuiTypeToMyType(memberInfo.type), memberInfo.name)
                else
                    writer:writeln('this.%s = <%s>(this.component.getChildAt(%s));', memberInfo.varName, fuiTypeToMyType(memberInfo.type), memberInfo.index)
                end
            elseif memberInfo.group==1 then
            --     if getMemberByName then
            --         writer:writeln('this.%s = this.getController("%s");', memberInfo.varName, memberInfo.name)
            --     else
            --         writer:writeln('this.%s = this.getControllerAt(%s);', memberInfo.varName, memberInfo.index)
            --     end
            else
                if getMemberByName then
                    writer:writeln('this.%s = <%s>(this.component.transition?.["%s"]);', memberInfo.varName, fuiTypeToMyType(memberInfo.type), memberInfo.name)
                else
                    writer:writeln('this.%s = <%s>(Object.values(this.component.transition || {})[%s]);', memberInfo.varName, memberInfo.index)
                end
            end
        end
        writer:endBlock() --constructor
        writer:endBlock() --class
        writer:writeln()
    end

    -- Package
    local binderName = codePkgName..'Binder'

    writer:writeln('export class %s', binderName)
    writer:startBlock()
    
    writer:writeln('create: ReturnType<typeof pixi_fairygui.addPackage>;')
    writer:writeln('constructor(app: { loader: PIXI.Loader })')
    writer:startBlock()
    writer:writeln('this.create = pixi_fairygui.addPackage(app, \'%s\');', codePkgName)
    writer:endBlock() --constrctor

    for i=0,classCnt-1 do
        local classInfo = classes[i]
        writer:writeln('create%s(): %s', classInfo.className, classInfo.className)
        writer:startBlock()
        writer:writeln('return new %s(this.create(\'%s\'));', classInfo.className, classInfo.resName)
        writer:endBlock() --createHoge
    end

    writer:endBlock() --class
    
    writer:save(exportCodePath..'/'..binderName..'.ts')
end

return genCode