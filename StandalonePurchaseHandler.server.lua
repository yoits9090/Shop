-- StandalonePurchaseHandler.server.lua
-- Copy this script directly into ServerScriptService in Roblox Studio

-- Get services
local Players = game:GetService("Players")
local MarketplaceService = game:GetService("MarketplaceService")

print("***********************************************************")
print("******* STANDALONE PURCHASE HANDLER SCRIPT RUNNING ********")
print("***********************************************************")

-- Track processed receipts
local processedReceipts = {}

-- Gamepass IDs
local gamepassIds = {
    [1150966154] = "Regeneration",
    [1155692418] = "2x Health",
    [1151894037] = "Sprint",
    [1149964231] = "2x Speed"
}

-- Developer Product IDs
local productIds = {
    [3261484089] = "3x Extra Lives",
    [3261484228] = "Revive",
    [3261490620] = "Revive Teammates"
}

-- Log function
local function log(level, message)
    print("[PurchaseHandler][" .. level .. "] " .. message)
end

-- Apply gamepass benefits
local function applyGamepassBenefits(player, gamepassId)
    log("Info", "Applying gamepass benefits for " .. player.Name .. ", gamepass ID: " .. gamepassId)
    
    if gamepassId == 1149964231 then -- 2x Speed
        local character = player.Character
        if character then
            local humanoid = character:FindFirstChildOfClass("Humanoid")
            if humanoid then
                log("Info", "Applying 2x speed to " .. player.Name .. "'s character")
                humanoid.WalkSpeed = humanoid.WalkSpeed * 2
            end
        end
    elseif gamepassId == 1155692418 then -- 2x Health
        local character = player.Character
        if character then
            local humanoid = character:FindFirstChildOfClass("Humanoid")
            if humanoid then
                log("Info", "Applying 2x health to " .. player.Name .. "'s character")
                humanoid.MaxHealth = humanoid.MaxHealth * 2
                humanoid.Health = humanoid.MaxHealth
            end
        end
    elseif gamepassId == 1150966154 then -- Regeneration
        log("Info", "Setting up regeneration for " .. player.Name)
        -- Add regeneration logic
    elseif gamepassId == 1151894037 then -- Sprint
        log("Info", "Setting up sprint for " .. player.Name)
        -- Add sprint logic
    end
end

-- Apply product benefits
local function applyProductBenefits(player, productId)
    log("Info", "Applying product benefits for " .. player.Name .. ", product ID: " .. productId)
    
    if productId == 3261484089 then -- 3x Extra Lives
        log("Info", "Giving 3 extra lives to " .. player.Name)
        -- Add extra lives logic
    elseif productId == 3261484228 then -- Revive
        log("Info", "Reviving " .. player.Name)
        -- Add revive logic
    elseif productId == 3261490620 then -- Revive Teammates
        log("Info", "Enabling revive teammates for " .. player.Name)
        -- Add revive teammates logic
    end
end

-- Check for gamepass ownership when character loads
local function onCharacterAdded(player, character)
    log("Info", "Character loaded for " .. player.Name .. ", checking gamepass ownership")
    
    for gamepassId, _ in pairs(gamepassIds) do
        local success, ownsPass = pcall(function()
            return MarketplaceService:UserOwnsGamePassAsync(player.UserId, gamepassId)
        end)
        
        if success and ownsPass then
            log("Info", player.Name .. " owns gamepass " .. gamepassId .. " (" .. gamepassIds[gamepassId] .. ")")
            applyGamepassBenefits(player, gamepassId)
        elseif not success then
            log("Error", "Failed to check if " .. player.Name .. " owns gamepass " .. gamepassId)
        end
    end
end

-- Handle gamepass purchases
MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, gamepassId, purchased)
    if purchased then
        log("Info", player.Name .. " purchased gamepass " .. gamepassId .. " (" .. (gamepassIds[gamepassId] or "Unknown") .. ")")
        applyGamepassBenefits(player, gamepassId)
    end
end)

-- Handle product purchases
MarketplaceService.ProcessReceipt = function(receiptInfo)
    log("Info", "Processing receipt for PlayerId: " .. receiptInfo.PlayerId .. ", ProductId: " .. receiptInfo.ProductId)
    
    -- Check if already processed
    if processedReceipts[receiptInfo.PurchaseId] then
        log("Info", "Receipt " .. receiptInfo.PurchaseId .. " already processed")
        return Enum.ProductPurchaseDecision.PurchaseGranted
    end
    
    local player = Players:GetPlayerByUserId(receiptInfo.PlayerId)
    if player then
        log("Info", player.Name .. " purchased product " .. receiptInfo.ProductId .. " (" .. (productIds[receiptInfo.ProductId] or "Unknown") .. ")")
        applyProductBenefits(player, receiptInfo.ProductId)
        processedReceipts[receiptInfo.PurchaseId] = true
        return Enum.ProductPurchaseDecision.PurchaseGranted
    else
        -- Player not in game, retry later
        log("Warning", "Player with ID " .. receiptInfo.PlayerId .. " not found, will retry later")
        return Enum.ProductPurchaseDecision.NotProcessedYet
    end
end

-- Handle players joining
Players.PlayerAdded:Connect(function(player)
    log("Info", player.Name .. " joined, setting up character added event")
    
    player.CharacterAdded:Connect(function(character)
        onCharacterAdded(player, character)
    end)
    
    -- Check if player already has a character
    if player.Character then
        onCharacterAdded(player, player.Character)
    end
end)

log("Info", "StandalonePurchaseHandler script fully initialized")
