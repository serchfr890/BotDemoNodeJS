// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ActivityHandler, CardFactory, MessageFactory } = require('botbuilder');
const WelcomeUserMessage = require('./Resources/WelcomeUser.json');
const { QnAMaker } = require('botbuilder-ai');

class EchoBot extends ActivityHandler {
    constructor() {
        super();
        try {
            this.qnaMaker = new QnAMaker({
                knowledgeBaseId: process.env.QnAKnowledgebaseId,
                endpointKey: process.env.QnAAuthKey,
                host: process.env.QnAEndpointHostName
            });
        } catch (err) {
            console.warn('No se pudo realizar la configuración de QnA Maker de manera correcta, por favor de verificar el archivo .env');
        }

        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            const qnaResults = await this.qnaMaker.getAnswers(context);
            if (qnaResults[0]) {
                await context.sendActivity(qnaResults[0].answer);
            } else {
                await context.sendActivity('Lo siento, aun no tengo el conocimiento suficiente para responder tu pregunta');
            }

            await context.sendActivity(this.sendSuggestionMessages());

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity({
                        attachments: [CardFactory.adaptiveCard(WelcomeUserMessage)]
                    });
                    await context.sendActivity(this.sendSuggestionMessages());
                }
            }
            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    sendSuggestionMessages() {
        return MessageFactory.suggestedActions(['¿Cómo encuentro mi clave de producto de windows?', 'He descargado un archivo ISO, ¿ahora qué?'], 'Para continuar escribe una pregunta o elije una.');
    }
}

module.exports.EchoBot = EchoBot;
